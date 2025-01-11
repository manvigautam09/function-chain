import React, { useState } from "react";
import SixDots from "@/assets/icons/SixDots";

import { Function } from "../Workflow";
import { evaluateExpression } from "@/utils/workflow";
import CustomDropdown from "../CustomDropdown";

interface FunctionCardProps {
  funcDetail: Function;
  functions: Function[];
  setFunctions: React.Dispatch<React.SetStateAction<Function[]>>;
}

const FunctionCard: React.FC<FunctionCardProps> = ({
  funcDetail,
  functions,
  setFunctions,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  // Add equation validation function
  const validateEquation = (
    equation: string
  ): { isValid: boolean; error?: string } => {
    // Allow empty equation while user is typing
    if (!equation.trim()) {
      return { isValid: false, error: "Equation cannot be empty" };
    }

    // Remove all spaces from the equation for easier validation
    const cleanEquation = equation.replace(/\s+/g, "");

    // Check if equation contains only allowed characters
    const validCharPattern = /^[0-9x+\-*/^.]+$/;
    if (!validCharPattern.test(cleanEquation)) {
      return {
        isValid: false,
        error: "Only numbers, x, and operators (+,-,*,/,^) are allowed",
      };
    }

    // Check for invalid patterns that would make the equation incorrect
    const invalidPatterns = [
      /\.\./, // Multiple decimal points
      /[+\-*/^]{2,}/, // Multiple operators in sequence
      /^\W/, // Equation starting with an operator (except minus)
      /[+*/^]$/, // Equation ending with an operator
      /\d+x\d+/, // Numbers on both sides of x (like 2x2)
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanEquation)) {
        return {
          isValid: false,
          error: "Invalid equation format",
        };
      }
    }

    // Check for basic syntax errors by evaluating
    try {
      evaluateExpression(cleanEquation, 1);
      return { isValid: true };
    } catch {
      return { isValid: false, error: "Invalid equation format" };
    }
  };
  // Add function to handle equation changes
  const handleEquationChange = (functionId: number, newEquation: string) => {
    setFunctions((prev) =>
      prev.map((f) => {
        if (f.id === functionId) {
          const validation = validateEquation(newEquation);
          return {
            ...f,
            equation: newEquation,
            equationError: validation.error,
          };
        }
        return f;
      })
    );
  };

  // Add this function to handle dropdown changes
  const handleNextFunctionChange = (sourceId: number, targetId: string) => {
    // If "None" is selected, remove connections
    if (targetId === "") {
      setFunctions((prev) =>
        prev.map((f) => {
          if (f.id === sourceId) {
            return { ...f, nextFunction: undefined };
          }
          if (f.previousFunction === sourceId) {
            return { ...f, previousFunction: undefined };
          }
          return f;
        })
      );
      return;
    }

    const targetIdNum = parseInt(targetId);

    // Handle connections similar to dot connections
    setFunctions((prev) => {
      // First check if the connection is valid
      const isValid = prev.every((f) => {
        // Don't allow self-connection
        if (sourceId === targetIdNum) return false;

        // Don't allow if target already has an input (except when it's the current connection)
        if (
          targetIdNum > 0 &&
          f.id === targetIdNum &&
          f.previousFunction !== undefined &&
          f.previousFunction !== sourceId
        ) {
          return false;
        }

        return true;
      });

      if (!isValid) return prev;

      // Check for circular dependency
      let currentId = targetIdNum;
      const visited = new Set([sourceId]);
      while (currentId > 0) {
        if (visited.has(currentId)) return prev; // Circular dependency found
        visited.add(currentId);
        const nextFunc = prev.find((f) => f.id === currentId);
        if (!nextFunc) break;
        currentId = nextFunc.nextFunction || 0;
      }

      // If all checks pass, update the connections
      return prev.map((f) => {
        if (f.id === sourceId) {
          return { ...f, nextFunction: targetIdNum };
        }
        if (targetIdNum > 0 && f.id === targetIdNum) {
          return { ...f, previousFunction: sourceId };
        }
        return f;
      });
    });
  };

  return (
    <div
      data-id={funcDetail.id}
      className="relative border-[#D3D3D3] bg-white px-5 py-4 border rounded-[15px] w-[250px] function-box"
      style={{
        position: "relative",
        zIndex: openDropdownId === funcDetail.id ? 9999 : 1,
      }}
    >
      <div className="flex items-center gap-2 mb-4 font-semibold text-[#A5A5A5] text-sm">
        <SixDots />
        Function: {funcDetail.id}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 text-xs">Equation</label>
          <input
            aria-label="equation"
            type="text"
            value={funcDetail.equation}
            onChange={(e) =>
              handleEquationChange(funcDetail.id, e.target.value)
            }
            className={`border-[#D3D3D3] p-2 border rounded-lg w-full font-medium text-xs
                      ${funcDetail.equationError ? "border-red-500" : ""}`}
          />
          {funcDetail.equationError && (
            <span className="mt-1 text-red-500 text-xs">
              {funcDetail.equationError}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 text-xs">
            Next function
          </label>
          <CustomDropdown
            functionId={funcDetail.id}
            currentValue={funcDetail.nextFunction}
            onSelect={(value) => handleNextFunctionChange(funcDetail.id, value)}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            functions={functions}
          />
        </div>
      </div>
      <div className="relative mt-11 h-5">
        <div className="top-1/2 -left-1.5 absolute flex bg-blue-500 rounded-full w-2 h-2 -translate-y-1/2 input-point outline outline-[#DBDBDB] outline-2 outline-offset-2">
          <p className="font-medium text-gray-700 text-xs -translate-y-1/2 translate-x-4">
            input
          </p>
        </div>
        <div className="top-1/2 -right-1.5 absolute flex bg-blue-500 rounded-full w-2 h-2 -translate-y-1/2 outline outline-[#DBDBDB] outline-2 outline-offset-2 output-point">
          <p className="font-medium text-gray-700 text-xs -translate-x-[46px] -translate-y-1/2">
            output
          </p>
        </div>
      </div>
    </div>
  );
};

export default FunctionCard;
