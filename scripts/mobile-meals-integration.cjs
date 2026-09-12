const assert = require('node:assert/strict');

module.exports = async function verifyMeals({ db, coach, clients, session, other, expectStatus }) {
  const meals = [];
  for (const [name, calories] of [
    ['Synthetic breakfast', 400],
    ['Synthetic breakfast swap', 500],
  ]) {
    meals.push(
      await db.meal.create({
        data: {
          name,
          type: 'BREAKFAST',
          coachId: coach.id,
          calories,
          protein: 20,
          carbs: 40,
          fat: 10,
          ingredients: JSON.stringify([{ name: 'Oats', quantity: 50, unit: 'g' }]),
          instructions: JSON.stringify(['Cook the oats.']),
        },
      }),
    );
  }
  const plan = await db.mealPlan.create({
    data: {
      name: 'Synthetic meal plan',
      clientId: clients[0].id,
      startDate: new Date(),
      mealAssignments: {
        create: meals.map(meal => ({ mealId: meal.id, mealType: 'BREAKFAST', dayOfWeek: 0, portion: 1.5 })),
      },
    },
    include: { mealAssignments: true },
  });
  const options = (await expectStatus('/api/user/meals/options', { token: session.accessToken })).data;
  assert.equal(options.optionsByType.BREAKFAST.length, 2);
  assert.equal(
    (await expectStatus('/api/user/meals/options', { token: other.accessToken })).data.optionsByType.BREAKFAST.length,
    0,
  );
  const item = index => ({
    mealId: meals[index].id,
    sourceAssignmentId: plan.mealAssignments.find(a => a.mealId === meals[index].id).id,
    mealType: 'BREAKFAST',
    slotIndex: 0,
  });
  const selected = (
    await expectStatus('/api/user/meals/selection', {
      method: 'PUT',
      token: session.accessToken,
      body: { items: [item(0)] },
    })
  ).data;
  assert.equal(selected.selectedTotals.calories, 600);
  const shopping = (
    await expectStatus('/api/user/meals/shopping-list', {
      method: 'POST',
      token: session.accessToken,
      body: { items: [item(0)] },
    })
  ).data;
  assert.ok(shopping.sections.flatMap(section => section.items).some(entry => /oats/i.test(entry.label)));
  assert.ok(shopping.selectionFingerprint);
  const swapped = (
    await expectStatus('/api/user/meals/selection', {
      method: 'PUT',
      token: session.accessToken,
      body: { items: [item(1)] },
    })
  ).data;
  assert.equal(swapped.selection.items[0].mealId, meals[1].id);
  assert.equal(swapped.selectedTotals.calories, 750);
  const dayDate = (await expectStatus('/api/user/adherence/current', { token: session.accessToken })).data.dayDate;
  const completion = { ...item(1), dayDate, portion: 1.5, calories: 500, protein: 20, carbs: 40, fat: 10 };
  await expectStatus('/api/user/meals/completions', { method: 'POST', token: other.accessToken, body: completion }, 403);
  await expectStatus('/api/user/meals/completions', { method: 'POST', token: other.accessToken, body: { ...completion, sourceAssignmentId: null } }, 403);
  await expectStatus('/api/user/meals/completions', { method: 'POST', token: session.accessToken, body: { ...completion, sourceAssignmentId: item(0).sourceAssignmentId } }, 403);
  assert.equal(await db.mealCompletion.count({ where: { clientId: clients[1].id } }), 0);
  await expectStatus('/api/user/meals/completions', { method: 'POST', token: session.accessToken, body: completion });
  await expectStatus('/api/user/meals/completions', { method: 'POST', token: session.accessToken, body: completion });
  const rows = await db.mealCompletion.findMany({ where: { clientId: clients[0].id } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].caloriesSnapshot, 750);
  await expectStatus('/api/user/meals/completions', { method: 'DELETE', token: session.accessToken, body: completion });
  assert.equal(await db.mealCompletion.count({ where: { clientId: clients[0].id } }), 0);
  console.log('PASS: assigned meal options, portion totals, swaps, shopping generation, completion retries, and undo');
};
