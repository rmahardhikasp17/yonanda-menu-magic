/**
 * HTML/React Renderer for Browser Preview
 * Hotel Yonanda POS System
 * 
 * Reads abstract blocks from receipt-template and renders to React components.
 */

import React from 'react';
import {
  ReceiptBlock,
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
} from '@/lib/receipt/receipt-types';

/**
 * HTML Renderer Component
 * Consumes blocks from template and renders to React/HTML
 */
export function HTMLRenderer({ blocks }: { blocks: ReceiptBlock[] }) {
  return (
    <div className="print-area p-4 font-mono text-xs bg-white">
      {blocks.map((block, index) => 
        block.visible ? (
          <RenderBlock key={`${block.type}-${index}`} block={block} />
        ) : null
      )}
    </div>
  );
}

/**
 * Block Dispatcher
 */
function RenderBlock({ block }: { block: ReceiptBlock }) {
  switch (block.type) {
    case 'header':
      return <HeaderBlock data={block.data as HeaderBlockData} />;
    case 'transaction-info':
      return <TransactionInfoBlock data={block.data as TransactionInfoBlockData} />;
    case 'receipt-number':
      return <ReceiptNumberBlock data={block.data as ReceiptNumberBlockData} />;
    case 'room-info':
      return block.data ? <RoomInfoBlock data={block.data as RoomInfoBlockData} /> : null;
    case 'guest-info':
      return block.data ? <GuestInfoBlock data={block.data as GuestInfoBlockData} /> : null;
    case 'items':
      return <ItemsBlock data={block.data as ItemsBlockData} />;
    case 'total':
      return <TotalBlock data={block.data as TotalBlockData} />;
    case 'payment':
      return block.data ? <PaymentBlock data={block.data as PaymentBlockData} /> : null;
    case 'notes':
      return <NotesBlock data={block.data as NotesBlockData} />;
    case 'footer':
      return <FooterBlock data={block.data as FooterBlockData} />;
    default:
      return null;
  }
}

// ============================================
// Block Components
// ============================================

function HeaderBlock({ data }: { data: HeaderBlockData }) {
  return (
    <>
      <div className="receipt-header text-center">
        <div className="text-xs font-mono">=================================</div>
        <div className="text-sm font-bold">{data.hotelName}</div>
        <div className="text-[9px]">{data.address}</div>
        <div className="text-[9px]">{data.city}</div>
        <div className="text-[9px]">{data.phone}</div>
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function TransactionInfoBlock({ data }: { data: TransactionInfoBlockData }) {
  return (
    <>
      <div className="space-y-0.5">
        <div className="receipt-row flex justify-between">
          <span>Tanggal</span>
          <span>{data.date}</span>
        </div>
        <div className="receipt-row flex justify-between">
          <span>Jam</span>
          <span>{data.time}</span>
        </div>
        <div className="receipt-row flex justify-between">
          <span>Jenis</span>
          <span>{data.type}</span>
        </div>
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function ReceiptNumberBlock({ data }: { data: ReceiptNumberBlockData }) {
  return (
    <>
      <div className="receipt-number text-center font-bold text-sm">
        No Nota : {data.number}
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function RoomInfoBlock({ data }: { data: RoomInfoBlockData }) {
  return (
    <>
      <div className="space-y-0.5">
        <div className="receipt-row flex justify-between">
          <span>No. Kamar</span>
          <span>{data.number}</span>
        </div>
        <div className="receipt-row flex justify-between">
          <span>Tipe</span>
          <span>{data.type}</span>
        </div>
        <div className="receipt-row flex justify-between">
          <span>Tarif/Mlm</span>
          <span>{formatCurrency(data.rate)}</span>
        </div>
        {data.nights !== undefined && (
          <div className="receipt-row flex justify-between">
            <span>Durasi</span>
            <span>{data.nights} malam</span>
          </div>
        )}
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function GuestInfoBlock({ data }: { data: GuestInfoBlockData }) {
  return (
    <>
      <div className="space-y-0.5">
        <div className="receipt-row flex justify-between">
          <span>Nama</span>
          <span className="text-right max-w-[100px] truncate">{data.name}</span>
        </div>
        {data.maskedKtp && (
          <div className="receipt-row flex justify-between">
            <span>No. KTP</span>
            <span>{data.maskedKtp}</span>
          </div>
        )}
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function ItemsBlock({ data }: { data: ItemsBlockData }) {
  if (data.items.length === 0) return null;

  return (
    <>
      <div className="space-y-0.5">
        {data.items.map((item, index) => (
          <div key={index} className="receipt-item-row flex justify-between text-[10px]">
            <span className="flex-1 truncate pr-1">
              {item.name} x{item.quantity}
            </span>
            <span className="whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function TotalBlock({ data }: { data: TotalBlockData }) {
  return (
    <>
      <div className="receipt-total flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{formatCurrency(data.amount)}</span>
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function PaymentBlock({ data }: { data: PaymentBlockData }) {
  return (
    <>
      <div className="receipt-row flex justify-between">
        <span>Bayar</span>
        <span>{data.method === 'cash' ? 'CASH' : 'QRIS'}</span>
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function NotesBlock({ data }: { data: NotesBlockData }) {
  return (
    <>
      <div className="receipt-warning text-center text-[10px]">
        <div>{data.text}</div>
      </div>
      <hr className="receipt-divider my-2 border-dashed border-gray-400" />
    </>
  );
}

function FooterBlock({ data }: { data: FooterBlockData }) {
  return (
    <div className="receipt-footer text-center text-[9px] text-gray-600">
      <div>=================================</div>
      <div>{data.text}</div>
      <div>=================================</div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
