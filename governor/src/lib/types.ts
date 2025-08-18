// Types based on governor-api.yaml and softphone-api.yaml

export interface SoftphoneConfig {
  authenticationId: string;
  registerPassword: string;
  authenticationUri?: string;
  registerRefresh?: number;
  callerId?: string;
  hostUri?: HostUri;
  proxyUri?: ProxyUri;
  settings?: SoftphoneSettings;
}

export type HostUri = 
  | { hostUri: string }
  | { domainHost: string; domainPort: number };

export type ProxyUri = 
  | { proxyUri: string }
  | { proxy: { host: string; port: number } };

export interface SoftphoneSettings {
  maxConcurrentCalls?: number;
  vad?: 'algorithmic' | 'streaming';
  language?: string;
  synthesisService?: 'yandex' | 'google' | 'elevenLabs';
  cps?: number;
  additionalRecognitionTime?: number;
  yandexSubaccount?: {
    folderId: string;
    serviceAccountId: string;
    serviceAccountKeyId: string;
    pemKey: string;
  };
  elevenlabsVoice?: string;
  phoneValidationEnabled?: boolean;
  use8InsteadOfPlus7?: boolean;
  endpoints?: {
    schedulerUrl: string;
    backendUrl: string;
  };
  useIpTrunk?: boolean;
  portRange?: {
    start: number;
    end: number;
  };
  stunServer?: string;
}

export type Signal = 
  | {
      type: 'new_user_phrase';
      messageId: string;
      message: string;
      audioUrl?: string;
      interruptedMessageId?: string;
    }
  | {
      type: 'event';
      direction: 'Incoming' | 'Outgoing';
      eventType: 'call_start' | 'call_end';
    }
  | {
      type: 'message_delivered';
      deliveryDate: {
        start: string;
        end: string;
      };
      messageId: string;
    };

export interface SignalPayload {
  date: string;
  configId: string;
  phone: string;
  taskId?: number;
  signal: Signal;
}

export interface SignalResponse {
  success: boolean;
  dialogId?: string;
}

export interface SoftphoneLogPayload {
  task_id: number;
  timestamp: string;
  event: 
    | { DialStarted: {} }
    | { DialEnded: { result: 'Success' | 'Timeout' | 'Forbidden' | 'WrongSdp' | { Failure: { code: number } } } };
}

// Softphone API types
export type BotMessage = 
  | { text: string }
  | { url: string }
  | { template: MessageTemplate }
  | { dtmf: string; repeatCount: number };

export interface MessageTemplate {
  template: string;
  originalTextVariables: TextVariable[];
  originalAudioVariables: AudioVariable[];
  currentTextVariables: TextVariable[];
  audioSource: string;
}

export interface TextVariable {
  name: string;
  value: string;
}

export interface AudioVariable {
  name: string;
  startMs: number;
  lengthMs: number;
}

export interface SayPayload {
  type: 'say';
  configId: string;
  phone: string;
  message: BotMessage;
  messageId: string;
  taskId?: number;
  dialogId?: string;
  interruptionWindow?: SayInterruptionWindow;
}

export interface SayInterruptionWindow {
  start: { time: number } | { fraction: number };
  end: { time: number } | { fraction: number };
}

export interface HangUpPayload {
  type: 'hangUp';
  configId: string;
  phone: string;
  taskId?: number;
  dialogId?: string;
}

export interface ClearQueuePayload {
  type: 'clearQueue';
  configId: string;
}

export interface DtmfPayload {
  type: 'dtmf';
  configId: string;
  phone: string;
  dtmf: string;
  repeatCount: number;
}

export interface TransferPayload {
  type: 'transfer';
  configId: string;
  phone: string;
  targetUri: string;
  referredBy?: string;
}

export interface SetConfigPayload {
  type: 'setConfig';
  configId: string;
  config: SoftphoneConfig;
}

export interface RemoveConfigPayload {
  type: 'removeConfig';
  configId: string;
}

export type ChatIntegrationMessage = 
  | SayPayload
  | HangUpPayload
  | ClearQueuePayload
  | DtmfPayload
  | TransferPayload
  | SetConfigPayload
  | RemoveConfigPayload;

export interface AppConfig {
  softphoneUrl: string;
  softphoneSecret: string;
}