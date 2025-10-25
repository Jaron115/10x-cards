import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the AI Generator page
 * Encapsulates all interactions with the generator UI
 */
export class GeneratorPage {
  readonly page: Page;

  // Form elements
  readonly sourceTextarea: Locator;
  readonly characterCount: Locator;
  readonly generateButton: Locator;

  // Proposal list elements
  readonly proposalsContainer: Locator;
  readonly proposalsLoadingSkeleton: Locator;
  readonly proposalsHeader: Locator;
  readonly proposalsApprovedCount: Locator;
  readonly proposalsSaveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements
    this.sourceTextarea = page.locator('[data-testid="generator-source-textarea"]');
    this.characterCount = page.locator('[data-testid="generator-character-count"]');
    this.generateButton = page.locator('[data-testid="generator-submit-button"]');

    // Proposal list elements
    this.proposalsContainer = page.locator('[data-testid="proposals-container"]');
    this.proposalsLoadingSkeleton = page.locator('[data-testid="proposals-loading-skeleton"]');
    this.proposalsHeader = page.locator('[data-testid="proposals-header"]');
    this.proposalsApprovedCount = page.locator('[data-testid="proposals-approved-count"]');
    this.proposalsSaveButton = page.locator('[data-testid="proposals-save-button"]').first();
  }

  /**
   * Navigate to the generator page
   */
  async goto() {
    await this.page.goto("/app/generator");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Navigate to generator via sidebar
   */
  async gotoViaSidebar() {
    await this.page.click('[data-testid="nav-generator"]');
    await this.page.waitForURL(/\/app\/generator/);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Fill source text and generate flashcards
   */
  async generateFlashcards(sourceText: string) {
    await this.sourceTextarea.fill(sourceText);
    await this.generateButton.click();
  }

  /**
   * Wait for proposals to be generated
   */
  async waitForProposalsToLoad(timeout = 30000) {
    // First wait for loading skeleton to appear
    await this.proposalsLoadingSkeleton.waitFor({ state: "visible", timeout: 5000 });

    // Then wait for it to disappear and proposals to appear
    await this.proposalsLoadingSkeleton.waitFor({ state: "hidden", timeout });
    await this.proposalsContainer.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Get proposal card by ID
   */
  getProposalCard(proposalId: string) {
    return new ProposalCard(this.page, proposalId);
  }

  /**
   * Get all proposal cards
   */
  async getAllProposalCards() {
    const cards = await this.page.locator('[data-testid^="proposal-card-"]').all();
    return cards.map((_, index) => {
      const id = `temp-${index}`; // In real scenario, extract ID from data-testid
      return new ProposalCard(this.page, id);
    });
  }

  /**
   * Get count of proposals
   */
  async getProposalsCount(): Promise<number> {
    const cards = await this.page.locator('[data-testid^="proposal-card-"]').count();
    return cards;
  }

  /**
   * Get approved count from UI
   */
  async getApprovedCount(): Promise<number> {
    const text = await this.proposalsApprovedCount.textContent();
    if (!text) return 0;

    // Extract number from text like "• Zatwierdzono: 3"
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Save approved flashcards
   */
  async saveFlashcards() {
    await this.proposalsSaveButton.click();
  }

  /**
   * Wait for save to complete
   */
  async waitForSaveToComplete(timeout = 10000) {
    // Wait for button to show "Zapisywanie..." and then go back to normal
    await this.page.waitForTimeout(500); // Small delay for UI update
    await this.proposalsSaveButton.waitFor({ state: "visible", timeout });
  }
}

/**
 * Page Object Model for a single proposal card
 */
export class ProposalCard {
  readonly page: Page;
  readonly proposalId: string;
  readonly card: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly editButton: Locator;
  readonly saveEditButton: Locator;
  readonly cancelEditButton: Locator;
  readonly frontText: Locator;
  readonly backText: Locator;
  readonly frontTextarea: Locator;
  readonly backTextarea: Locator;

  constructor(page: Page, proposalId: string) {
    this.page = page;
    this.proposalId = proposalId;

    this.card = page.locator(`[data-testid="proposal-card-${proposalId}"]`);
    this.approveButton = page.locator(`[data-testid="proposal-approve-button-${proposalId}"]`);
    this.rejectButton = page.locator(`[data-testid="proposal-reject-button-${proposalId}"]`);
    this.editButton = page.locator(`[data-testid="proposal-edit-button-${proposalId}"]`);
    this.saveEditButton = page.locator(`[data-testid="proposal-save-edit-button-${proposalId}"]`);
    this.cancelEditButton = page.locator(`[data-testid="proposal-cancel-edit-button-${proposalId}"]`);
    this.frontText = page.locator(`[data-testid="proposal-front-text-${proposalId}"]`);
    this.backText = page.locator(`[data-testid="proposal-back-text-${proposalId}"]`);
    this.frontTextarea = page.locator(`[data-testid="proposal-front-textarea-${proposalId}"]`);
    this.backTextarea = page.locator(`[data-testid="proposal-back-textarea-${proposalId}"]`);
  }

  /**
   * Approve this proposal
   */
  async approve() {
    await this.approveButton.click();
  }

  /**
   * Reject this proposal
   */
  async reject() {
    await this.rejectButton.click();
  }

  /**
   * Start editing this proposal
   */
  async startEdit() {
    await this.editButton.click();
  }

  /**
   * Edit and save the proposal
   */
  async editAndSave(newFront?: string, newBack?: string) {
    await this.startEdit();

    if (newFront) {
      await this.frontTextarea.fill(newFront);
    }

    if (newBack) {
      await this.backTextarea.fill(newBack);
    }

    await this.saveEditButton.click();
  }

  /**
   * Cancel editing
   */
  async cancelEdit() {
    await this.cancelEditButton.click();
  }

  /**
   * Get front text content
   */
  async getFrontText(): Promise<string> {
    return (await this.frontText.textContent()) || "";
  }

  /**
   * Get back text content
   */
  async getBackText(): Promise<string> {
    return (await this.backText.textContent()) || "";
  }

  /**
   * Check if proposal is approved (has green styling)
   */
  async isApproved(): Promise<boolean> {
    const classes = await this.card.getAttribute("class");
    return classes?.includes("border-green") || false;
  }

  /**
   * Check if proposal is rejected (has reduced opacity)
   */
  async isRejected(): Promise<boolean> {
    const classes = await this.card.getAttribute("class");
    return classes?.includes("opacity-50") || false;
  }
}
