import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortOption } from "../../types/characterManagement";

interface SearchAndSortProps {
  searchTerm: string;
  sortOption: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
}

export const SearchAndSort: React.FC<SearchAndSortProps> = ({ searchTerm, sortOption, onSearchChange, onSortChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-white/90 text-sm font-medium">Search Characters</label>
        <Input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
        />
      </div>

      <div className="space-y-2">
        <label className="text-white/90 text-sm font-medium">Sort By</label>
        <Select value={sortOption} onValueChange={(value: SortOption) => onSortChange(value)}>
          <SelectTrigger className="bg-white/20 border-white/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="alphabetical-az" className="text-white hover:bg-gray-700">
              Alphabetical (A-Z)
            </SelectItem>
            <SelectItem value="alphabetical-za" className="text-white hover:bg-gray-700">
              Alphabetical (Z-A)
            </SelectItem>
            <SelectItem value="difficulty-easy-hard" className="text-white hover:bg-gray-700">
              Difficulty (Easy to Hard)
            </SelectItem>
            <SelectItem value="difficulty-hard-easy" className="text-white hover:bg-gray-700">
              Difficulty (Hard to Easy)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
