"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import Fuse from "fuse.js"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ComboBox({ 
  items, 
  value, 
  onValueChange, 
  placeholder, 
  searchPlaceholder, 
  emptyPlaceholder, 
  custom, 
  disabled 
}) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const fuse = React.useMemo(() => new Fuse(items, {
    keys: ["label"],
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 1,
  }), [items])

  const filteredItems = React.useMemo(() => {
    if (!inputValue) return items
    // If exact match found using normal filter, prioritize it
    const exactMatches = items.filter(item => 
      item.label.toLowerCase().includes(inputValue.toLowerCase())
    )
    if (exactMatches.length > 0) return exactMatches

    // Otherwise use fuzzy search
    return fuse.search(inputValue).map(result => result.item)
  }, [fuse, inputValue, items])

  const handleAddCustom = () => {
    if (inputValue) {
      onValueChange(inputValue)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-white"
        >
          {value
            ? items.find((item) => item.value === value)?.label || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {filteredItems.length === 0 && (
              <div className="py-6 text-center text-sm">{emptyPlaceholder}</div>
            )}
            <CommandGroup>
              {custom && inputValue && !items.some(item => item.label.toLowerCase() === inputValue.toLowerCase()) && (
                <CommandItem
                  onSelect={handleAddCustom}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              )}
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}