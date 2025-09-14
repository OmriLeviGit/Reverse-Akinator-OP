import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortOption } from "../../types/characterFilters";

interface SearchAndSortProps {
  searchTerm: string;
  sortOption: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
}

export const SearchAndSort = ({
  searchTerm,
  sortOption,
  onSearchChange,
  onSortChange,
}: SearchAndSortProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">Search Characters</label>
        <Input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground hover:bg-input hover:brightness-125"
        />
      </div>
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">Sort By</label>
        <Select value={sortOption} onValueChange={(value: SortOption) => onSortChange(value)}>
          <SelectTrigger className="bg-input hover:bg-input hover:brightness-125 border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="alphabetical-az" className="text-popover-foreground hover:bg-secondary">
              Alphabetical (A-Z)
            </SelectItem>
            <SelectItem value="alphabetical-za" className="text-popover-foreground hover:bg-secondary">
              Alphabetical (Z-A)
            </SelectItem>
            <SelectItem value="difficulty-easy-hard" className="text-popover-foreground hover:bg-secondary">
              Difficulty (Easy to Hard)
            </SelectItem>
            <SelectItem value="difficulty-hard-easy" className="text-popover-foreground hover:bg-secondary">
              Difficulty (Hard to Easy)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
