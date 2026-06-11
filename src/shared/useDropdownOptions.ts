import { useState, useEffect } from 'react';
import { optionArrays } from './dropdownOptions';

/**
 * useDropdownOptions
 *
 * Wraps a shared option array from dropdownOptions.js and returns a
 * stateful copy. Listens for the 'dropdownOptionsUpdated' custom event
 * (dispatched by loadDropdownOptionsFromServer / saveDropdownOptionsToServer)
 * so the component re-renders whenever admin-managed options change.
 *
 * Usage:
 *   const genders = useDropdownOptions(genderOptions);
 *   // genders is always in sync with the latest server-managed values
 */
export function useDropdownOptions(optionArray: string[]): string[] {
  const [options, setOptions] = useState<string[]>(() => [...optionArray]);

  useEffect(() => {
    // Sync if the reference array was already mutated before mount
    setOptions([...optionArray]);

    const handleUpdate = () => {
      setOptions([...optionArray]);
    };

    window.addEventListener('dropdownOptionsUpdated', handleUpdate);
    return () => window.removeEventListener('dropdownOptionsUpdated', handleUpdate);
  }, [optionArray]);

  let dropdownKey = '';
  for (const [k, arr] of Object.entries(optionArrays)) {
    if (arr === optionArray) {
      dropdownKey = k;
      break;
    }
  }

  const result = [...options];
  (result as any).dropdownKey = dropdownKey;

  return result;
}
