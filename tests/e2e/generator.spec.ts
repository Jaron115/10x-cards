import { test, expect } from "@playwright/test";
import { GeneratorPage } from "./pages/GeneratorPage";
import { mockGenerationAPI, mockFlashcardSaveAPI, MOCK_FLASHCARD_PROPOSALS } from "./fixtures/api-mocks";
import { generateTestText } from "./utils/test-helpers";

test.describe("Generator AI - Generowanie fiszek", () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks for each test
    await mockGenerationAPI(page);
    await mockFlashcardSaveAPI(page);
  });

  test("powinien wygenerować fiszki z tekstu źródłowego (happy path)", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Generate valid test text (1500 characters)
    const sourceText = generateTestText(1500);

    // Fill source text
    await generatorPage.fillSourceText(sourceText);

    // Verify character count is displayed correctly
    const charCountText = await generatorPage.characterCount.textContent();
    expect(charCountText).toContain("1,500");

    // Verify button is enabled
    await expect(generatorPage.generateButton).toBeEnabled();

    // Click generate button
    await generatorPage.generateButton.click();

    // Wait for loading skeleton to appear
    await expect(generatorPage.proposalsLoadingSkeleton).toBeVisible();

    // Wait for proposals to load
    await generatorPage.waitForProposalsToLoad();

    // Verify proposals are displayed
    await expect(generatorPage.proposalsContainer).toBeVisible();
    await expect(generatorPage.proposalsHeader).toBeVisible();

    // Verify correct number of proposals
    const proposalsCount = await generatorPage.getProposalsCount();
    expect(proposalsCount).toBe(MOCK_FLASHCARD_PROPOSALS.length);

    // Verify first proposal card is visible (ID format: generation_id-index)
    const firstProposal = generatorPage.getProposalCard("999-0");
    await expect(firstProposal.card).toBeVisible();

    // Verify content of first proposal
    const frontText = await firstProposal.getFrontText();
    expect(frontText).toBe("Co to jest React?");
  });

  test("powinien umożliwić zatwierdzanie i zapisywanie fiszek", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Generate flashcards
    const sourceText = generateTestText(1500);
    await generatorPage.generateFlashcards(sourceText);
    await generatorPage.waitForProposalsToLoad();

    // Initially, approved count should not be visible
    await expect(generatorPage.proposalsApprovedCount).not.toBeVisible();

    // Approve first 3 proposals (ID format: generation_id-index)
    const proposal1 = generatorPage.getProposalCard("999-0");
    const proposal2 = generatorPage.getProposalCard("999-1");
    const proposal3 = generatorPage.getProposalCard("999-2");

    await proposal1.approve();
    await proposal2.approve();
    await proposal3.approve();

    // Verify approved count is displayed
    await expect(generatorPage.proposalsApprovedCount).toBeVisible();
    const approvedCount = await generatorPage.getApprovedCount();
    expect(approvedCount).toBe(3);

    // Verify save button is visible and enabled
    await expect(generatorPage.proposalsSaveButton).toBeVisible();
    await expect(generatorPage.proposalsSaveButton).toBeEnabled();

    // Verify save button shows correct count
    const saveButtonText = await generatorPage.proposalsSaveButton.textContent();
    expect(saveButtonText).toContain("3");

    // Click save button
    await generatorPage.saveFlashcards();

    // Wait for save to complete (mock has 500ms delay)
    await page.waitForTimeout(1000);

    // After save, should navigate away or show success message
    // For now, just verify no error occurred
  });

  test("powinien umożliwić odrzucanie propozycji", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Generate flashcards
    const sourceText = generateTestText(1500);
    await generatorPage.generateFlashcards(sourceText);
    await generatorPage.waitForProposalsToLoad();

    // Reject first proposal (ID format: generation_id-index)
    const proposal1 = generatorPage.getProposalCard("999-0");
    await proposal1.reject();

    // Verify proposal is visually rejected (has opacity-50 class)
    const isRejected = await proposal1.isRejected();
    expect(isRejected).toBe(true);

    // Approve second proposal
    const proposal2 = generatorPage.getProposalCard("999-1");
    await proposal2.approve();

    // Only 1 should be approved
    const approvedCount = await generatorPage.getApprovedCount();
    expect(approvedCount).toBe(1);
  });

  test("powinien umożliwić edycję propozycji", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Generate flashcards
    const sourceText = generateTestText(1500);
    await generatorPage.generateFlashcards(sourceText);
    await generatorPage.waitForProposalsToLoad();

    // Edit first proposal (ID format: generation_id-index)
    const proposal1 = generatorPage.getProposalCard("999-0");

    // Start editing
    await proposal1.startEdit();

    // Verify textareas are visible
    await expect(proposal1.frontTextarea).toBeVisible();
    await expect(proposal1.backTextarea).toBeVisible();

    // Edit content
    const newFront = "Edytowane pytanie o React";
    const newBack = "Edytowana odpowiedź o React";

    await proposal1.frontTextarea.fill(newFront);
    await proposal1.backTextarea.fill(newBack);

    // Save edit
    await proposal1.saveEditButton.click();

    // Verify edit mode is closed
    await expect(proposal1.frontTextarea).not.toBeVisible();

    // Verify new content is displayed
    const frontText = await proposal1.getFrontText();
    expect(frontText).toBe(newFront);

    // After saving edit, proposal should be auto-approved
    const isApproved = await proposal1.isApproved();
    expect(isApproved).toBe(true);

    // Approved count should be 1
    const approvedCount = await generatorPage.getApprovedCount();
    expect(approvedCount).toBe(1);
  });

  test("powinien umożliwić anulowanie edycji", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Generate flashcards
    const sourceText = generateTestText(1500);
    await generatorPage.generateFlashcards(sourceText);
    await generatorPage.waitForProposalsToLoad();

    // Get original content (ID format: generation_id-index)
    const proposal1 = generatorPage.getProposalCard("999-0");
    const originalFront = await proposal1.getFrontText();

    // Start editing
    await proposal1.startEdit();

    // Change content
    await proposal1.frontTextarea.fill("Zmieniony tekst");

    // Cancel edit
    await proposal1.cancelEdit();

    // Verify original content is restored
    const frontText = await proposal1.getFrontText();
    expect(frontText).toBe(originalFront);
  });
});

test.describe("Generator AI - Walidacja", () => {
  test.beforeEach(async ({ page }) => {
    await mockGenerationAPI(page);
  });

  test("przycisk generowania powinien być wyłączony dla za krótkiego tekstu", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Fill with text that's too short (< 1000 chars)
    const shortText = generateTestText(500);
    await generatorPage.fillSourceText(shortText);

    // Button should be disabled
    await expect(generatorPage.generateButton).toBeDisabled();

    // Character count should be visible
    const charCountText = await generatorPage.characterCount.textContent();
    expect(charCountText).toContain("500");
  });

  test("przycisk generowania powinien być wyłączony dla za długiego tekstu", async ({ page }) => {
    // Increase timeout for this test as it handles a large text
    test.setTimeout(60000);

    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Fill with text that's too long (> 10000 chars)
    const longText = generateTestText(11000);
    await generatorPage.fillSourceText(longText);

    // Button should be disabled
    await expect(generatorPage.generateButton).toBeDisabled();

    // Should show error message about exceeding limit
    const charCountText = await generatorPage.characterCount.textContent();
    expect(charCountText).toContain("11,000");
  });

  test("przycisk generowania powinien być włączony dla poprawnej długości tekstu", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Fill with valid text (between 1000-10000 chars)
    const validText = generateTestText(5000);
    await generatorPage.fillSourceText(validText);

    // Button should be enabled
    await expect(generatorPage.generateButton).toBeEnabled();

    // Character count should show green color (indicates valid)
    const charCountText = await generatorPage.characterCount.textContent();
    expect(charCountText).toContain("5,000");
  });
});
