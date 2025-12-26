'use client';

import * as React from 'react';
import { X, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';

export interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = (item: string) => {
    onChange(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
  };

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", selected.length > 0 ? 'h-auto' : 'h-10', className)}
          onClick={() => setOpen(!open)}
        >
            {selected.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                {selected.map(item => (
                    <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(item)
                    }}
                    >
                    {item}
                    <span
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleUnselect(item);
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUnselect(item);
                        }}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                    </Badge>
                ))}
                </div>
            ) : (
                <span className="text-muted-foreground">{placeholder}</span>
            )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
            <CommandInput 
                placeholder="Search..."
                value={inputValue}
                onValueChange={setInputValue}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option);
                  return (
                    <CommandItem
                      key={option}
                      onSelect={() => handleSelect(option)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className={cn('h-4 w-4')} />
                      </div>
                      <span>{option}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
