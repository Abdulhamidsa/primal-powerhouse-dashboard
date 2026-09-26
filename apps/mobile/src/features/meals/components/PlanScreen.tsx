import { IntakeCard } from './IntakeCard';
import { Image, Modal, View } from 'react-native';
import { Button, Card, Copy, Label, Screen, Status } from '@/components/ui';
import { useMeals, formatMealText } from '../hooks/useMeals';
import type { MealTypeKey } from '../types/meals.types';
const sections: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
export default function PlanScreen() {
  const model = useMeals();
  return (
    <Screen
      title="Meal Plan"
      subtitle="Choose your meals and mark them done after eating."
      onRefresh={model.refresh}
      refreshing={model.options.isValidating || model.selection.isValidating || model.adherence.isValidating}
    >
      <Status
        loading={model.selection.isLoading}
        error={model.selection.error || model.action.error}
        notice={model.action.notice}
        cachedAt={model.selection.cachedAt}
      />
      {model.summaryLabel ? (
        <Card>
          <Label>Selected daily nutrition</Label>
          <Copy>{model.summaryLabel}</Copy>
          {model.targetLabel ? <Copy muted>{model.targetLabel}</Copy> : null}
        </Card>
      ) : null}
      {sections.map(type => (
        <Card key={type}>
          <Label>{type}</Label>
          {model.items
            .filter(item => item.mealType === type)
            .map(item => (
              <View key={`${type}:${item.slotIndex}`} style={{ gap: 12 }}>
                {item.meal.imageUrl ? (
                  <Image
                    accessibilityLabel={item.meal.name}
                    source={{ uri: item.meal.imageUrl }}
                    style={{ width: '100%', height: 170, borderRadius: 20 }}
                  />
                ) : null}
                <Copy>{item.meal.name}</Copy>
                <Copy muted>{item.portionLabel}</Copy>
                <Copy muted>{item.nutritionLabel}</Copy>
                <Button secondary title="Ingredients & instructions" onPress={() => model.setDetail(item.meal)} />
                {item.side ? (
                  <>
                    <Copy>Side: {item.side.name}</Copy>
                    <Button
                      secondary
                      title="View side details"
                      onPress={() => model.setSideDetail(item.side ?? null)}
                    />
                  </>
                ) : null}
                <Button
                  title={model.completed(item) ? 'Eaten · undo' : 'Done — I ate this meal'}
                  disabled={model.action.pending || model.offline || !model.completionReady}
                  onPress={() => model.toggle(item)}
                />
                <Button secondary title="Swap meal" onPress={() => model.setPicker({ type, slot: item.slotIndex })} />
                {type === 'LUNCH' || type === 'DINNER' ? (
                  <Button
                    secondary
                    title="Change side"
                    onPress={() => model.setPicker({ type, slot: item.slotIndex, sidesOnly: true })}
                  />
                ) : null}
              </View>
            ))}
          {(
            type === 'SNACK'
              ? model.items.filter(i => i.mealType === type).length < (model.options.data?.constraints.snackMax ?? 0)
              : !model.items.some(i => i.mealType === type)
          ) ? (
            <Button
              title={`Choose ${type.toLowerCase()}`}
              onPress={() => model.setPicker({ type, slot: type === 'SNACK' ? model.nextSnackSlot : 0 })}
            />
          ) : null}
        </Card>
      ))}
      <IntakeCard />
      <Modal
        visible={!!model.picker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => model.setPicker(null)}
      >
        <Screen title={model.picker?.sidesOnly ? 'Choose a side' : 'Choose a meal'}>
          <Button secondary title="Cancel" onPress={() => model.setPicker(null)} />
          <Status
            loading={model.options.isLoading}
            error={model.options.error || model.action.error}
            cachedAt={model.options.cachedAt}
          />
          {model.picker
            ? model.optionCards.map(option => (
                <Card key={option.sourceAssignmentId}>
                  <Copy>{option.meal.name}</Copy>
                  <Copy muted>{option.nutritionLabel}</Copy>
                  {option.side ? (
                    <>
                      <Copy>Side · {option.side.name}</Copy>
                      <Copy muted>
                        {option.side.type === 'SOUP' ? 'Soup' : 'Salad'} · {Math.round(option.side.calories)} kcal
                      </Copy>
                      <Copy muted>{option.side.ingredients.join(', ')}</Copy>
                    </>
                  ) : null}
                  <Button
                    title={model.picker?.sidesOnly ? 'Choose this side' : 'Choose and save'}
                    disabled={model.offline || model.action.pending}
                    onPress={() => model.choose(option)}
                  />
                </Card>
              ))
            : null}
          {model.picker && !model.options.isLoading && model.optionCards.length === 0 ? (
            <Copy muted>
              {model.picker.sidesOnly
                ? 'No side options are assigned yet.'
                : 'No meal options are assigned for this slot.'}
            </Copy>
          ) : null}
        </Screen>
      </Modal>
      <Modal
        visible={!!model.sideDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => model.setSideDetail(null)}
      >
        <Screen title={model.sideDetail?.name ?? 'Side'}>
          <Button secondary title="Close" onPress={() => model.setSideDetail(null)} />
          {model.sideDetail?.imageUrl ? (
            <Image
              accessibilityLabel={model.sideDetail.name}
              source={{ uri: model.sideDetail.imageUrl }}
              style={{ width: '100%', height: 220, borderRadius: 20 }}
            />
          ) : null}
          <Card>
            <Copy>{model.sideDetail?.type === 'SOUP' ? 'Soup' : 'Salad'}</Copy>
            {model.sideDetail?.foodOrigin ? <Copy muted>{model.sideDetail.foodOrigin}</Copy> : null}
            <Copy>
              {model.sideDetail
                ? `${Math.round(model.sideDetail.calories)} kcal · ${Math.round(model.sideDetail.protein)}g protein · ${Math.round(model.sideDetail.carbs)}g carbs · ${Math.round(model.sideDetail.fat)}g fat`
                : ''}
            </Copy>
            <Label>Ingredients</Label>
            <Copy>{model.sideDetail?.ingredients.join('\n')}</Copy>
            {model.sideDetail?.spices.length ? (
              <>
                <Label>Spices</Label>
                <Copy>{model.sideDetail.spices.join('\n')}</Copy>
              </>
            ) : null}
            {model.sideDetail?.instructions.length ? (
              <>
                <Label>Instructions</Label>
                <Copy>{model.sideDetail.instructions.map((step, index) => `${index + 1}. ${step}`).join('\n')}</Copy>
              </>
            ) : null}
          </Card>
        </Screen>
      </Modal>
      <Modal
        visible={!!model.detail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => model.setDetail(null)}
      >
        <Screen title={model.detail?.name ?? 'Meal'}>
          <Button secondary title="Close" onPress={() => model.setDetail(null)} />
          {model.detail?.imageUrl ? (
            <Image
              accessibilityLabel={model.detail.name}
              source={{ uri: model.detail.imageUrl }}
              style={{ width: '100%', height: 240, borderRadius: 20 }}
            />
          ) : null}
          <Card>
            <Copy>{model.detail?.description}</Copy>
            {model.detail ? (
              <Copy>
                {Math.round(model.detail.calories)} kcal · {Math.round(model.detail.protein)}g protein ·{' '}
                {Math.round(model.detail.carbs)}g carbs · {Math.round(model.detail.fat)}g fat
              </Copy>
            ) : null}
            {model.detail && (model.detail.prepTime ?? 0) + (model.detail.cookTime ?? 0) > 0 ? (
              <Copy muted>
                Prep {model.detail.prepTime ?? 0} min · Cook {model.detail.cookTime ?? 0} min
              </Copy>
            ) : null}
            {model.detail?.servings ? (
              <Copy muted>
                {model.detail.servings} serving{model.detail.servings === 1 ? '' : 's'}
              </Copy>
            ) : null}
            <Label>Ingredients</Label>
            <Copy>{formatMealText(model.detail?.ingredients) || 'No ingredients listed.'}</Copy>
            {model.detail?.spices ? (
              <>
                <Label>Spices</Label>
                <Copy>{formatMealText(model.detail.spices)}</Copy>
              </>
            ) : null}
            <Label>Instructions</Label>
            <Copy>{formatMealText(model.detail?.instructions) || 'No instructions listed.'}</Copy>
          </Card>
        </Screen>
      </Modal>
    </Screen>
  );
}
