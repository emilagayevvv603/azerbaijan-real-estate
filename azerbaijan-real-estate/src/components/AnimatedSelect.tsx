import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface AnimatedSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
}

export default function AnimatedSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon,
  label,
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div id={id} ref={containerRef} className="relative w-full text-left">
      {label && (
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Button interface */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-semibold text-gray-800 flex items-center justify-between hover:bg-white hover:border-gray-200 focus:outline-none focus:border-brand-red focus:bg-white transition duration-200 cursor-pointer shadow-sm ${
          isOpen ? "border-brand-red bg-white ring-2 ring-red-500/10" : ""
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-brand-red shrink-0">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="text-gray-400 shrink-0"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      {/* Dropdown Options List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto"
          >
            <div className="py-1.5">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors duration-150 flex items-center justify-between ${
                      isSelected
                        ? "bg-red-50 text-brand-red font-bold"
                        : "text-gray-700 hover:bg-gray-50 hover:text-brand-red"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
