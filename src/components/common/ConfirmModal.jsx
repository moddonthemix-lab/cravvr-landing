import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * ConfirmModal - A reusable confirmation dialog. Pass `inputLabel` to switch
 * into prompt mode; the confirmed input string is delivered via onConfirm(value).
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  inputLabel = null,
  inputPlaceholder = '',
  inputRequired = false,
}) => {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  const canSubmit = !inputLabel || !inputRequired || inputValue.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onConfirm(inputLabel ? inputValue.trim() : undefined);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto sm:mx-0 mb-3">
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                variant === 'danger'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-info/10 text-info'
              )}
            >
              <span className="h-6 w-6">
                {variant === 'danger' ? Icons.alertCircle : Icons.info}
              </span>
            </span>
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        {inputLabel && (
          <div className="space-y-2">
            <Label htmlFor="confirm-modal-input">
              {inputLabel}{inputRequired ? ' *' : ''}
            </Label>
            <Input
              id="confirm-modal-input"
              ref={inputRef}
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button type="button" variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            variant={variant === 'danger' ? 'destructive' : 'default'}
            autoFocus={!inputLabel}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;
