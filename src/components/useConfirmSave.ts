import React, { useState, useCallback } from 'react';
import ConfirmSaveModal from './ConfirmSaveModal';

export function useConfirmSave() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const confirmSave = useCallback((action: () => void | Promise<void>) => {
    setPendingAction(() => action);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingAction || isSaving) return;
    setIsSaving(true);
    try {
      await pendingAction();
    } finally {
      setIsSaving(false);
      setIsOpen(false);
      setPendingAction(null);
    }
  }, [pendingAction, isSaving]);

  const handleCancel = useCallback(() => {
    if (isSaving) return;
    setIsOpen(false);
    setPendingAction(null);
  }, [isSaving]);

  const ConfirmDialog = useCallback(() => {
    return React.createElement(ConfirmSaveModal, {
      isOpen,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      isLoading: isSaving,
    });
  }, [isOpen, handleConfirm, handleCancel, isSaving]);

  return {
    confirmSave,
    ConfirmDialog,
    isConfirmOpen: isOpen,
    isSaving,
  };
}
