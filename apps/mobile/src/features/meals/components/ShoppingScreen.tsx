import { Button, Card, Copy, Label, Screen, Status } from '@/components/ui';
import { useShopping } from '../hooks/useShopping';

export default function ShoppingScreen() {
  const model = useShopping();
  return (
    <Screen
      title="Shopping list"
      subtitle="Everything in one place"
      onRefresh={model.refresh}
      refreshing={model.list.isValidating}
    >
      <Status
        loading={model.selection.isLoading || model.list.isLoading}
        error={model.selection.error || model.list.error || model.error}
        notice={model.notice}
        cachedAt={model.list.cachedAt}
      />
      <Copy muted>Ingredients, spices, and meal notes pulled from your selected plan.</Copy>
      <Button
        title="Regenerate from current meal plan"
        onPress={model.refresh}
        disabled={model.offline || model.list.isValidating || !model.selection.data?.selection.items.length}
      />
      {model.list.data ? (
        <>
          <Copy>
            {model.checkedCount} of {model.totalCount} items collected
          </Copy>
          <Copy muted>Generated {new Date(model.list.data.generatedAt).toLocaleString()}</Copy>
          <Button secondary title="Copy list" disabled={!model.totalCount} onPress={model.copy} />
          <Button secondary title="Share list" disabled={!model.totalCount} onPress={model.share} />
          <Button
            secondary
            title="Reset checked items"
            disabled={!model.ready || !model.checkedCount}
            onPress={model.reset}
          />
          {model.sections.map(section => (
            <Card key={section.key}>
              <Label>{section.title}</Label>
              <Button
                secondary
                title={section.allChecked ? 'Uncheck this section' : 'Check this section'}
                disabled={!model.ready || !section.items.length}
                onPress={() => model.markSection(section.key, !section.allChecked)}
              />
              {section.items.map(item => (
                <Button
                  secondary
                  key={item.id}
                  title={`${item.quantity ?? ''} ${item.label}`.trim()}
                  disabled={!model.ready}
                  onPress={() => model.toggle(item.id)}
                />
              ))}
            </Card>
          ))}
        </>
      ) : !model.selection.isLoading && !model.selection.data?.selection.items.length ? (
        <Copy muted>Choose your meals in Plan to create your shopping list.</Copy>
      ) : null}
    </Screen>
  );
}
