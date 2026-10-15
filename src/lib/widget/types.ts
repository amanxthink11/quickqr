export type WidgetType = 'upi' | 'whatsapp' | 'review' | 'menu' | 'website' | 'custom' | 'url';
export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetBorderRadius = 'full' | 'rounded' | 'square';
export type WidgetShadow = 'soft' | 'medium' | 'strong' | 'none' | 'subtle' | 'elevated';
export type WidgetIcon = 'wallet' | 'whatsapp' | 'star' | 'utensils' | 'globe' | 'qrcode' | 'upi' | 'review' | 'menu' | 'website' | 'custom';

export type WidgetClickBehavior = 'auto' | 'direct' | 'modal' | 'qr';
export type WidgetOpenTarget = '_blank' | '_self';

export interface WidgetConfig {
  type: WidgetType;
  payload: string;
  buttonLabel: string;
  buttonIcon: string;
  brandColor: string;
  buttonTextColor: string;
  position: WidgetPosition;
  size: WidgetSize;
  borderRadius: WidgetBorderRadius;
  shadow: WidgetShadow;
  popupTitle: string;
  popupDescription: string;
  ctaText: string;
  mobileBehavior?: 'floating' | 'docked';
  qrDataUrl?: string;
  clickBehavior?: WidgetClickBehavior;
  openInNewTab?: boolean;
  target?: WidgetOpenTarget;
  showQrModal?: boolean;
  // Backward compatibility aliases
  buttonText?: string;
  modalTitle?: string;
  modalDescription?: string;
  helperText?: string;
}

export interface WidgetValidationResult {
  isValid: boolean;
  errors: string[];
}
