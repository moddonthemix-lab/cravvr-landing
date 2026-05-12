import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// In-app sign-in / sign-up modal. Wraps Clerk's <SignIn>/<SignUp> so we
// can add the food-lover vs truck-owner role toggle above the form (Clerk's
// hosted modal doesn't allow that customization).
//
// The signup role is passed to Clerk as unsafeMetadata.role; the
// clerk-webhook reads it and creates the matching owners row.
const AuthDialog = ({ open, mode = 'login', onClose }) => {
  const [role, setRole] = useState('customer');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-w-md p-6 bg-background border-border overflow-y-auto max-h-[90vh]"
        showCloseButton
      >
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Cravvr</h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {mode === 'signup' && (
          <div className="mb-4">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              I'm signing up as
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={cn(
                  'rounded-lg border p-3 text-sm font-medium transition-colors',
                  role === 'customer'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                🍔 Food Lover
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={cn(
                  'rounded-lg border p-3 text-sm font-medium transition-colors',
                  role === 'owner'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                🚚 Truck Owner
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          {mode === 'signup' ? (
            <SignUp
              routing="virtual"
              signInUrl="/login"
              unsafeMetadata={{ role }}
              appearance={{ elements: { card: 'shadow-none border-none' } }}
            />
          ) : (
            <SignIn
              routing="virtual"
              signUpUrl="/login?mode=signup"
              appearance={{ elements: { card: 'shadow-none border-none' } }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
