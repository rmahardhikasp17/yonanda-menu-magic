// Type declarations for Web Serial API and Web Bluetooth API
// These are experimental browser APIs not included in standard TypeScript libs

declare global {
  // Web Serial API types
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }

  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    flowControl?: 'none' | 'hardware';
  }

  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }

  // Web Bluetooth API types
  interface Navigator {
    bluetooth?: {
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
      getDevices?(): Promise<BluetoothDevice[]>;
    };
  }

  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    filters?: BluetoothLEScanFilter[];
    optionalServices?: string[];
  }

  interface BluetoothLEScanFilter {
    services?: string[];
    name?: string;
    namePrefix?: string;
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    watchAdvertisements?(): Promise<void>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    properties: BluetoothCharacteristicProperties;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }

  interface BluetoothCharacteristicProperties {
    write: boolean;
    writeWithoutResponse: boolean;
  }
}

export {};
