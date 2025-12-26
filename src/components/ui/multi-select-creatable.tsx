
'use client';

import * as React from 'react';
import { X, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export interface MultiSelectCreatableProps {
  options: string[];
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
  className?: string;
}

export function MultiSelectCreatable({
  options: initialOptions,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectCreatableProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState(initialOptions);

  const handleSelect = (item: string) => {
    onChange(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  const handleCreate = (item: string) => {
    if (item && !options.includes(item)) {
      const newOptions = [...options, item];
      setOptions(newOptions);
      onChange(prev => [...prev, item]);
    }
  };

  const filteredOptions = options.filter(
    option => !selected.includes(option)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start h-auto"
        >
          {selected.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {selected.map(item => (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1 mb-1"
                  onClick={() => handleSelect(item)}
                >
                  {item}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSelect(item);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleSelect(item)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search or create..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue && !options.includes(inputValue) ? (
                 <CommandItem
                  onSelect={() => {
                    handleCreate(inputValue);
                    setInputValue('');
                  }}
                  className="cursor-pointer"
                >
                  Create "{inputValue}"
                </CommandItem>
              ) : (
                'No results found.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    handleSelect(option);
                    setInputValue('');
                  }}
                  className="cursor-pointer"
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.length > 0 && (
                <>
                <CommandSeparator />
                <CommandGroup>
                    <CommandItem
                        onSelect={() => onChange([])}
                        className="justify-center text-center text-muted-foreground"
                    >
                        Clear selection
                    </CommandItem>
                </CommandGroup>
                </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
