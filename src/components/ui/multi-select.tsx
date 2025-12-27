// "use client";

// import * as React from "react";
// import { X, Check } from "lucide-react";

// import { cn } from "@/lib/utils";
// import { Badge } from "@/components/ui/badge";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";

// export interface MultiSelectProps {
//   options: string[];
//   selected: string[];
//   onChange: React.Dispatch<React.SetStateAction<string[]>>;
//   placeholder?: string;
//   className?: string;
// }

// export function MultiSelect({
//   options,
//   selected,
//   onChange,
//   placeholder = "Select items…",
//   className,
// }: MultiSelectProps) {
//   const [open, setOpen] = React.useState(false);

//   const handleSelect = (item: string) => {
//     onChange((prev) =>
//       prev.includes(item)
//         ? prev.filter((i) => i !== item)
//         : [...prev, item]
//     );
//   };

//   const handleUnselect = (item: string) => {
//     onChange((prev) => prev.filter((i) => i !== item));
//   };

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <Button
//           variant="outline"
//           role="combobox"
//           aria-expanded={open}
//           className={cn(
//             "w-full justify-between min-h-10 h-auto",
//             className
//           )}
//         >
//           {selected.length > 0 ? (
//             <div className="flex flex-wrap gap-1">
//               {selected.map((item) => (
//                 <Badge key={item} variant="secondary" className="flex items-center gap-1">
//                   {item}
//                   <button
//                     type="button"
//                     aria-label={`Remove ${item}`}
//                     className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleUnselect(item);
//                     }}
//                   >
//                     <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
//                   </button>
//                 </Badge>
//               ))}
//             </div>
//           ) : (
//             <span className="text-muted-foreground">{placeholder}</span>
//           )}
//         </Button>
//       </PopoverTrigger>

//       <PopoverContent
//         align="start"
//         sideOffset={4}
//         className="w-[--radix-popover-trigger-width] p-0 z-50"
//       >

//         <div className="p-1">
//           {options.length > 0 ? (
//             options.map((option) => {
//               const isSelected = selected.includes(option);
//               return (
//                 <Button
//                   variant="ghost"
//                   key={option}
//                   onClick={() => handleSelect(option)}
//                   className="w-full justify-start h-8 px-2"
//                 >
//                    <Check
//                     className={cn(
//                       "mr-2 h-4 w-4",
//                       isSelected ? "opacity-100" : "opacity-0"
//                     )}
//                   />
//                   <span>{option}</span>
//                 </Button>
//               );
//             })
//           ) : (
//             <div className="text-center text-sm text-muted-foreground py-2">
//               No results found.
//             </div>
//           )}
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// }

"use client";

import * as React from "react";
import { X, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
  placeholder = "Select items…",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (item: string) => {
    onChange((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const handleUnselect = (item: string) => {
    onChange((prev) => prev.filter((i) => i !== item));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto",
            className
          )}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((item) => (
                <Badge key={item} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(item);
                    }}
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

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[--radix-popover-trigger-width] p-0 z-50"
        onInteractOutside={(e) => {
          // Allow clicking inside the popover
          e.preventDefault();
        }}
      >
        <div className="p-1">
          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <Button
                  variant="ghost"
                  key={option}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                  className="w-full justify-start h-8 px-2"
                >
                   <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option}</span>
                </Button>
              );
            })
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              No results found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}