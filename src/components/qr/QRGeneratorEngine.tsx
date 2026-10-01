'use client';

import React, { useState, useMemo } from 'react';
import {
  QRType,
  QRPayloadInputMap,
  QRCustomization,
} from '@/lib/qr/types';
import {
  DEFAULT_CUSTOMIZATION,
  INITIAL_INPUTS,
  QR_TYPE_INFO,
} from '@/lib/qr/presets';
import { buildQRPayload } from '@/lib/qr/payloads';
import { validateQRInput, assessQRReadability } from '@/lib/qr/validation';
import { QRTypeSelector } from './QRTypeSelector';
import { QRCustomizer } from './QRCustomizer';
import { QRPreview } from './QRPreview';

// Input Components
import { UPIInput } from './inputs/UPIInput';
import { WhatsAppInput } from './inputs/WhatsAppInput';
import { URLInput } from './inputs/URLInput';
import { WiFiInput } from './inputs/WiFiInput';
import { VCardInput } from './inputs/VCardInput';
import { PhoneInput } from './inputs/PhoneInput';
import { EmailInput } from './inputs/EmailInput';
import { TextInput } from './inputs/TextInput';
import { GoogleMapsInput } from './inputs/GoogleMapsInput';
import { GoogleReviewInput } from './inputs/GoogleReviewInput';
import { PDFInput } from './inputs/PDFInput';
import { MenuInput } from './inputs/MenuInput';

interface QRGeneratorEngineProps {
  initialType?: QRType;
  allowTypeSwitching?: boolean;
}

export const QRGeneratorEngine: React.FC<QRGeneratorEngineProps> = ({
  initialType = 'upi',
  allowTypeSwitching = true,
}) => {
  const [selectedType, setSelectedType] = useState<QRType>(initialType);
  const [inputs, setInputs] = useState<QRPayloadInputMap>(INITIAL_INPUTS);

  // Set default frame text tailored to the initial type
  const [customization, setCustomization] = useState<QRCustomization>(() => {
    let frameText = 'SCAN ME';
    let fgColor = DEFAULT_CUSTOMIZATION.fgColor;
    let frameColor = DEFAULT_CUSTOMIZATION.frameColor;
    const dotStyle = DEFAULT_CUSTOMIZATION.dotStyle;

    if (initialType === 'upi') {
      frameText = 'SCAN & PAY WITH ANY UPI APP';
      fgColor = '#065F46'; // Emerald
      frameColor = '#065F46';
    } else if (initialType === 'whatsapp') {
      frameText = 'CHAT ON WHATSAPP';
      fgColor = '#0F766E';
      frameColor = '#0F766E';
    } else if (initialType === 'review') {
      frameText = 'REVIEW US ON GOOGLE';
      fgColor = '#B45309';
      frameColor = '#B45309';
    } else if (initialType === 'menu') {
      frameText = 'VIEW DIGITAL MENU';
      fgColor = '#881337';
      frameColor = '#881337';
    }

    return {
      ...DEFAULT_CUSTOMIZATION,
      frameText,
      fgColor,
      frameColor,
      dotStyle,
    };
  });

  // Handle switching QR type
  const handleTypeChange = (type: QRType) => {
    setSelectedType(type);

    // Auto-update frame text preset according to type if user hasn't heavily customized
    let frameText = customization.frameText;
    let frameColor = customization.frameColor;
    let fgColor = customization.fgColor;

    if (type === 'upi') {
      frameText = 'SCAN & PAY WITH ANY UPI APP';
      fgColor = '#065F46';
      frameColor = '#065F46';
    } else if (type === 'whatsapp') {
      frameText = 'CHAT ON WHATSAPP';
      fgColor = '#0F766E';
      frameColor = '#0F766E';
    } else if (type === 'review') {
      frameText = 'REVIEW US ON GOOGLE';
      fgColor = '#B45309';
      frameColor = '#B45309';
    } else if (type === 'menu') {
      frameText = 'VIEW DIGITAL MENU';
      fgColor = '#881337';
      frameColor = '#881337';
    } else if (type === 'wifi') {
      frameText = 'CONNECT TO WI-FI';
      fgColor = '#0284C7';
      frameColor = '#0284C7';
    } else if (type === 'vcard') {
      frameText = 'SAVE CONTACT CARD';
    }

    setCustomization((prev) => ({
      ...prev,
      frameText,
      frameColor,
      fgColor,
    }));
  };

  // Update specific input payload
  const updateInput = <T extends QRType>(type: T, value: QRPayloadInputMap[T]) => {
    setInputs((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Build current payload
  const currentPayload = useMemo(() => {
    return buildQRPayload(selectedType, inputs[selectedType]);
  }, [selectedType, inputs]);

  // Validation
  const validation = useMemo(() => {
    return validateQRInput(selectedType, inputs[selectedType]);
  }, [selectedType, inputs]);

  // Readability / contrast analysis
  const readability = useMemo(() => {
    return assessQRReadability(customization, currentPayload.length);
  }, [customization, currentPayload]);

  const typeInfo = QR_TYPE_INFO[selectedType];

  return (
    <div className="w-full space-y-6">
      {/* Type Selector (if enabled) */}
      {allowTypeSwitching && (
        <div className="bg-neutral-50/60 p-4 rounded-2xl border border-neutral-200/80">
          <QRTypeSelector
            selectedType={selectedType}
            onSelectType={handleTypeChange}
          />
        </div>
      )}

      {/* Main Two-Column Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form & Customizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Input Panel */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  {typeInfo.shortTitle} Configuration
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {typeInfo.description}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                {typeInfo.badge}
              </span>
            </div>

            {/* Type-Specific Forms */}
            {selectedType === 'upi' && (
              <UPIInput
                value={inputs.upi}
                onChange={(val) => updateInput('upi', val)}
              />
            )}
            {selectedType === 'whatsapp' && (
              <WhatsAppInput
                value={inputs.whatsapp}
                onChange={(val) => updateInput('whatsapp', val)}
              />
            )}
            {selectedType === 'url' && (
              <URLInput
                value={inputs.url}
                onChange={(val) => updateInput('url', val)}
              />
            )}
            {selectedType === 'wifi' && (
              <WiFiInput
                value={inputs.wifi}
                onChange={(val) => updateInput('wifi', val)}
              />
            )}
            {selectedType === 'vcard' && (
              <VCardInput
                value={inputs.vcard}
                onChange={(val) => updateInput('vcard', val)}
              />
            )}
            {selectedType === 'phone' && (
              <PhoneInput
                value={inputs.phone}
                onChange={(val) => updateInput('phone', val)}
              />
            )}
            {selectedType === 'email' && (
              <EmailInput
                value={inputs.email}
                onChange={(val) => updateInput('email', val)}
              />
            )}
            {selectedType === 'text' && (
              <TextInput
                value={inputs.text}
                onChange={(val) => updateInput('text', val)}
              />
            )}
            {selectedType === 'maps' && (
              <GoogleMapsInput
                value={inputs.maps}
                onChange={(val) => updateInput('maps', val)}
              />
            )}
            {selectedType === 'review' && (
              <GoogleReviewInput
                value={inputs.review}
                onChange={(val) => updateInput('review', val)}
                onApplyPresetText={(text) =>
                  setCustomization((prev) => ({ ...prev, frameText: text }))
                }
              />
            )}
            {selectedType === 'pdf' && (
              <PDFInput
                value={inputs.pdf}
                onChange={(val) => updateInput('pdf', val)}
              />
            )}
            {selectedType === 'menu' && (
              <MenuInput
                value={inputs.menu}
                onChange={(val) => updateInput('menu', val)}
                onApplyPresetText={(text) =>
                  setCustomization((prev) => ({ ...prev, frameText: text }))
                }
              />
            )}
          </div>

          {/* Customizer Panel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-neutral-900">
                Design & Brand Styling
              </h3>
              <span className="text-xs text-neutral-500">Presets • Colors • Shapes • Frames</span>
            </div>
            <QRCustomizer
              customization={customization}
              onChange={setCustomization}
            />
          </div>
        </div>

        {/* Right Column: Preview & Download Panel (5 cols, sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <QRPreview
            payload={currentPayload}
            customization={customization}
            validation={validation}
            readability={readability}
            qrTypeTitle={typeInfo.title}
            qrType={selectedType}
            businessName={
              selectedType === 'upi'
                ? inputs.upi.payeeName
                : selectedType === 'menu'
                ? inputs.menu.restaurantName
                : selectedType === 'vcard'
                ? inputs.vcard.organization || `${inputs.vcard.firstName} ${inputs.vcard.lastName}`.trim()
                : undefined
            }
            subtitle={
              selectedType === 'upi'
                ? inputs.upi.payeeName || 'Scan to Pay via UPI'
                : selectedType === 'whatsapp'
                ? 'Chat with us on WhatsApp'
                : selectedType === 'menu'
                ? inputs.menu.restaurantName || 'Scan for Digital Menu'
                : 'Point camera to scan'
            }
          />
        </div>
      </div>
    </div>
  );
};
