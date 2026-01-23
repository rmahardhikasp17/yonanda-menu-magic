/**
 * ESC/POS Renderer for Thermal Printers (58mm)
 * Hotel Yonanda POS System
 * 
 * Reads abstract blocks from receipt-template and renders to ESC/POS commands.
 * Implements ReceiptRenderer interface.
 */

import {
  ReceiptBlock,
  ReceiptRenderer,
  HeaderBlockData,
  TransactionInfoBlockData,
  ReceiptNumberBlockData,
  RoomInfoBlockData,
  GuestInfoBlockData,
  ItemsBlockData,
  TotalBlockData,
  PaymentBlockData,
  NotesBlockData,
  FooterBlockData,
} from './receipt-types';

// ESC/POS Commands
const ESC_POS = {
  INIT: new Uint8Array([0x1B, 0x40]),
  LF: new Uint8Array([0x0A]),
  ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
  FONT_NORMAL: new Uint8Array([0x1B, 0x21, 0x00]),
  FONT_BOLD: new Uint8Array([0x1B, 0x21, 0x08]),
};

const textEncoder = new TextEncoder();

/**
 * ESC/POS Renderer for Serial Port (COM Port)
 */
export class ESCPOSRenderer implements ReceiptRenderer {
  private port: SerialPort;
  private readonly LINE_WIDTH = 32;
  private readonly EQUALS_LINE = ''.padStart(32, '=');
  private readonly DASH_LINE = ''.padStart(32, '-');

  constructor(port: SerialPort) {
    this.port = port;
  }

  /**
   * Render all blocks to thermal printer
   */
  async render(blocks: ReceiptBlock[]): Promise<void> {
    // Initialize printer
    await this.sendCommand(ESC_POS.INIT);

    // Render each visible block
    for (const block of blocks) {
      if (block.visible) {
        await this.renderBlock(block);
      }
    }

    // Feed paper
    await this.sendCommand(ESC_POS.LF);
    await this.sendCommand(ESC_POS.LF);
    await this.sendCommand(ESC_POS.LF);
    await this.sendCommand(ESC_POS.LF);
  }

  /**
   * Render single block based on type
   */
  async renderBlock(block: ReceiptBlock): Promise<void> {
    switch (block.type) {
      case 'header':
        await this.renderHeader(block.data as HeaderBlockData);
        break;
      case 'transaction-info':
        await this.renderTransactionInfo(block.data as TransactionInfoBlockData);
        break;
      case 'receipt-number':
        await this.renderReceiptNumber(block.data as ReceiptNumberBlockData);
        break;
      case 'room-info':
        if (block.data) await this.renderRoomInfo(block.data as RoomInfoBlockData);
        break;
      case 'guest-info':
        if (block.data) await this.renderGuestInfo(block.data as GuestInfoBlockData);
        break;
      case 'items':
        await this.renderItems(block.data as ItemsBlockData);
        break;
      case 'total':
        await this.renderTotal(block.data as TotalBlockData);
        break;
      case 'payment':
        if (block.data) await this.renderPayment(block.data as PaymentBlockData);
        break;
      case 'notes':
        await this.renderNotes(block.data as NotesBlockData);
        break;
      case 'footer':
        await this.renderFooter(block.data as FooterBlockData);
        break;
    }
  }

  // ============================================
  // Block Renderers
  // ============================================

  private async renderHeader(data: HeaderBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_CENTER);
    await this.printLine(this.EQUALS_LINE);
    await this.sendCommand(ESC_POS.FONT_BOLD);
    await this.printLine(data.hotelName);
    await this.sendCommand(ESC_POS.FONT_NORMAL);
    await this.printLine(data.address);
    await this.printLine(data.city);
    await this.printLine(data.phone);
    await this.printLine(this.DASH_LINE);
  }

  private async renderTransactionInfo(data: TransactionInfoBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_LEFT);
    await this.printLine(this.formatRow('Tanggal', data.date));
    await this.printLine(this.formatRow('Jam', data.time));
    await this.printLine(this.formatRow('Jenis', data.type));
    await this.printLine(this.DASH_LINE);
  }

  private async renderReceiptNumber(data: ReceiptNumberBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_CENTER);
    await this.sendCommand(ESC_POS.FONT_BOLD);
    await this.printLine(`No Nota : ${data.number}`);
    await this.sendCommand(ESC_POS.FONT_NORMAL);
    await this.printLine(this.DASH_LINE);
  }

  private async renderRoomInfo(data: RoomInfoBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_LEFT);
    await this.printLine(this.formatRow('No. Kamar', data.number));
    await this.printLine(this.formatRow('Tipe', data.type));
    await this.printLine(this.formatRow('Tarif/Mlm', this.formatCurrency(data.rate)));
    
    if (data.nights !== undefined) {
      await this.printLine(this.formatRow('Durasi', `${data.nights} malam`));
    }
    
    await this.printLine(this.DASH_LINE);
  }

  private async renderGuestInfo(data: GuestInfoBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_LEFT);
    await this.printLine(this.formatRow('Nama', data.name.substring(0, 16)));
    
    if (data.maskedKtp) {
      await this.printLine(this.formatRow('No. KTP', data.maskedKtp));
    }
    
    await this.printLine(this.DASH_LINE);
  }

  private async renderItems(data: ItemsBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_LEFT);
    
    for (const item of data.items) {
      const itemName = `${item.name} x${item.quantity}`;
      const itemPrice = this.formatCurrency(item.subtotal);
      await this.printLine(this.formatRow(itemName.substring(0, 20), itemPrice));
    }
    
    await this.printLine(this.DASH_LINE);
  }

  private async renderTotal(data: TotalBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_LEFT);
    await this.sendCommand(ESC_POS.FONT_BOLD);
    await this.printLine(this.formatRow('TOTAL', this.formatCurrency(data.amount)));
    await this.sendCommand(ESC_POS.FONT_NORMAL);
    await this.printLine(this.DASH_LINE);
  }

  private async renderPayment(data: PaymentBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_LEFT);
    const methodText = data.method === 'cash' ? 'CASH' : 'QRIS';
    await this.printLine(this.formatRow('Bayar', methodText));
    await this.printLine(this.DASH_LINE);
  }

  private async renderNotes(data: NotesBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_CENTER);
    await this.printLine(data.text);
    await this.printLine(this.DASH_LINE);
  }

  private async renderFooter(data: FooterBlockData): Promise<void> {
    await this.sendCommand(ESC_POS.ALIGN_CENTER);
    await this.printLine(this.EQUALS_LINE);
    await this.printLine(data.text);
    await this.printLine(this.EQUALS_LINE);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private formatRow(left: string, right: string): string {
    const spaces = this.LINE_WIDTH - left.length - right.length;
    if (spaces < 1) {
      return left.substring(0, this.LINE_WIDTH - right.length - 1) + ' ' + right;
    }
    return left + ' '.repeat(spaces) + right;
  }

  private formatCurrency(amount: number): string {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }

  private async sendCommand(command: Uint8Array): Promise<void> {
    if (!this.port.writable) {
      throw new Error('Port tidak dapat ditulis');
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(command);
    } finally {
      writer.releaseLock();
    }
  }

  private async printLine(text: string): Promise<void> {
    await this.sendText(text);
    await this.sendCommand(ESC_POS.LF);
  }

  private async sendText(text: string): Promise<void> {
    const bytes = textEncoder.encode(text);
    if (!this.port.writable) {
      throw new Error('Port tidak dapat ditulis');
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }
  }
}
