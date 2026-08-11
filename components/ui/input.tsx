import * as React from 'react';
import { cn } from '@/lib/utils';
import { parseKurdishNumbers } from '@/lib/format';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, ...props }, ref) => {
    const isNumericContext = type === 'number' || type === 'tel' || props.inputMode === 'numeric' || props.inputMode === 'decimal' || props.inputMode === 'tel';
    
    // Change type="number" and type="tel" to "text" so browsers don't block Eastern Arabic characters natively
    const actualType = (type === 'number' || type === 'tel') ? 'text' : type;
    
    let actualInputMode = props.inputMode;
    if (!props.inputMode) {
      if (type === 'number') actualInputMode = 'numeric';
      if (type === 'tel') actualInputMode = 'tel';
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumericContext) {
        let converted = parseKurdishNumbers(e.target.value);
        
        // If it was meant to be a strict number, strip any non-numeric characters
        if (type === 'number') {
          converted = converted.replace(/[^0-9.-]/g, '');
        } else if (type === 'tel' || props.inputMode === 'tel') {
          converted = converted.replace(/[^0-9+\-\s()]/g, '');
        }

        if (e.target.value !== converted) {
          const input = e.target;
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, converted);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return; 
          }
        }
      } 
      onChange?.(e);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      if (isNumericContext) {
        const input = e.target as HTMLInputElement;
        let converted = parseKurdishNumbers(input.value);
        
        if (type === 'number') {
          converted = converted.replace(/[^0-9.-]/g, '');
        } else if (type === 'tel' || props.inputMode === 'tel') {
          converted = converted.replace(/[^0-9+\-\s()]/g, '');
        }

        if (input.value !== converted) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, converted);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
          }
        }
      }
      props.onInput?.(e);
    };

    return (
      <input
        type={actualType}
        inputMode={actualInputMode}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={handleChange}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
