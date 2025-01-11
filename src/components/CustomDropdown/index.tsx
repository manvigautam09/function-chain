import { useRef } from "react";
import { Function } from "../Workflow";

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const FIXED_EXECUTION_ORDER = {
  1: 2, // Function 1 can only connect to Function 2
  2: 4, // Function 2 can only connect to Function 4
  4: 5, // Function 4 can only connect to Function 5
  5: 3, // Function 5 can only connect to Function 3
  3: -1, // Function 3 can only connect to Final Output
};

const CustomDropdown = ({
  functionId,
  currentValue,
  onSelect,
  openDropdownId,
  setOpenDropdownId,
  functions,
}: {
  functionId: number;
  currentValue?: number;
  onSelect: (value: string) => void;
  openDropdownId: number | null;
  setOpenDropdownId: (id: number | null) => void;
  functions: Function[];
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allowedNextFunction =
    FIXED_EXECUTION_ORDER[functionId as keyof typeof FIXED_EXECUTION_ORDER];

  const availableConnections: DropdownOption[] = [
    {
      value: "",
      label: "None",
      disabled: functionId === 1,
    },
    ...functions
      .filter((f) => f.id !== functionId)
      .map((f) => ({
        value: f.id.toString(),
        label: `Function: ${f.id}`,
        disabled: allowedNextFunction !== f.id,
      })),
  ];

  if (!functions.some((f) => f.nextFunction === -1)) {
    availableConnections.push({
      value: "-1",
      label: "Final Output",
      disabled: allowedNextFunction !== -1,
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <div
        onClick={() =>
          setOpenDropdownId(openDropdownId === functionId ? null : functionId)
        }
        className="flex justify-between items-center border-[#D3D3D3] bg-white hover:bg-gray-50 px-3 py-2 border rounded-lg w-full font-medium text-xs cursor-pointer"
      >
        <span className="text-gray-700">
          {currentValue === undefined
            ? "None"
            : currentValue === -1
            ? "Final Output"
            : `Function: ${currentValue}`}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${
            openDropdownId === functionId ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown menu */}
      {openDropdownId === functionId && (
        <div
          className="z-[9999] absolute border-[#D3D3D3] bg-white shadow-lg mt-1 border rounded-lg w-full max-h-60 overflow-auto"
          style={{
            minWidth: "200px",
            position: "absolute",
            top: "100%",
            left: 0,
          }}
        >
          {availableConnections.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 text-xs font-medium ${
                option.disabled
                  ? "cursor-not-allowed text-gray-400 bg-gray-50"
                  : "cursor-pointer hover:bg-blue-50"
              } ${currentValue === Number(option.value) ? "bg-blue-100" : ""}`}
              onClick={() => {
                if (!option.disabled) {
                  onSelect(option.value);
                  setOpenDropdownId(null);
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
