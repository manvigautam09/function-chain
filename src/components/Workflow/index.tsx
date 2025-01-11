import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

import FunctionCard from "../FunctionCard";
import { SVGDimensions } from "@/types/workflow";
import background from "@/assets/background/pattern.png";
import { COLORS, FUNCTION_DEFAULTS } from "@/constants/workflow";
import { createPath, evaluateExpression } from "@/utils/workflow";

export interface Function {
  id: number;
  equation: string;
  nextFunction?: number;
  previousFunction?: number;
  equationError?: string;
}

interface Connection {
  start: { x: number; y: number };
  end: { x: number; y: number };
  isTerminal?: boolean;
}

export default function Workflow() {
  const [functions, setFunctions] = useState<Function[]>([
    { id: 1, equation: "x^2", previousFunction: 0, nextFunction: 2 },
    { id: 2, equation: "2x+4", previousFunction: 1, nextFunction: 4 },
    { id: 3, equation: "x^2+20", previousFunction: 5, nextFunction: -1 },
    { id: 4, equation: "x-2", previousFunction: 2, nextFunction: 5 },
    { id: 5, equation: "x/2", previousFunction: 4, nextFunction: 3 },
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [initialValue, setInitialValue] = useState(2);
  const [finalOutput, setFinalOutput] = useState(0);

  // Add state for SVG dimensions
  const [svgDimensions, setSvgDimensions] = useState<SVGDimensions>({
    width: 0,
    height: 0,
  });

  const getConnectionPoint = (
    element: Element,
    type: "input" | "output",
    containerRect: DOMRect
  ) => {
    const point =
      type === "input"
        ? element.querySelector(".input-point")?.getBoundingClientRect()
        : element.querySelector(".output-point")?.getBoundingClientRect();

    if (!point) return null;

    return {
      x: point.left + point.width / 2 - containerRect.left,
      y: point.top + point.height / 2 - containerRect.top,
    };
  };

  const updateDimensionsAndConnections = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    setSvgDimensions({
      width: containerRect.width,
      height: containerRect.height,
    });

    const newConnections: Connection[] = [];
    const boxes = containerRef.current.getElementsByClassName("function-box");
    const initialValueEl = containerRef.current.querySelector(".initial-value");
    const finalOutputEl = containerRef.current.querySelector(".final-output");

    // Add connections between function boxes
    functions.forEach((sourceFunc) => {
      if (sourceFunc.nextFunction === undefined) return;

      const sourceBox = Array.from(boxes).find(
        (b) => parseInt(b.getAttribute("data-id") || "0") === sourceFunc.id
      );

      let targetElement: Element | null = null;

      if (sourceFunc.nextFunction === -1) {
        // Connection to final output
        targetElement = finalOutputEl;
      } else if (sourceFunc.nextFunction === 0) {
        // Connection from initial value
        targetElement = initialValueEl;
      } else {
        // Connection between functions
        targetElement =
          Array.from(boxes).find(
            (b) =>
              parseInt(b.getAttribute("data-id") || "0") ===
              sourceFunc.nextFunction
          ) || null;
      }

      if (sourceBox && targetElement) {
        const startPoint = getConnectionPoint(
          sourceBox,
          "output",
          containerRect
        );
        const endPoint = getConnectionPoint(
          targetElement,
          "input",
          containerRect
        );

        if (startPoint && endPoint) {
          newConnections.push({
            start: startPoint,
            end: endPoint,
            isTerminal:
              sourceFunc.nextFunction === -1 || sourceFunc.nextFunction === 0,
          });
        }
      }
    });

    // Add initial value connections
    const initialConnections = functions.filter(
      (f) => f.previousFunction === 0
    );
    initialConnections.forEach((targetFunc) => {
      const targetBox = Array.from(boxes).find(
        (b) => parseInt(b.getAttribute("data-id") || "0") === targetFunc.id
      );

      if (initialValueEl && targetBox) {
        const startPoint = getConnectionPoint(
          initialValueEl,
          "output",
          containerRect
        );
        const endPoint = getConnectionPoint(targetBox, "input", containerRect);

        if (startPoint && endPoint) {
          newConnections.push({
            start: startPoint,
            end: endPoint,
            isTerminal: true,
          });
        }
      }
    });

    setConnections(newConnections);
  }, [functions]);

  // Add an effect to update connections when functions change
  useEffect(() => {
    updateDimensionsAndConnections();
  }, [updateDimensionsAndConnections, functions]);

  // Add this function to calculate the final output
  const calculateOutput = useCallback(() => {
    let currentValue = initialValue;
    let currentFunctionId: number | undefined = functions.find(
      (f) => f.previousFunction === 0
    )?.id;

    // Check if any function has an error
    const hasErrors = functions.some((f) => f.equationError);
    if (hasErrors) {
      setFinalOutput(0);
      return;
    }

    console.log("Starting calculation with initial value:", currentValue);

    while (currentFunctionId && currentFunctionId > 0) {
      const currentFunction = functions.find((f) => f.id === currentFunctionId);
      if (!currentFunction) break;

      console.log(
        `Processing Function ${currentFunctionId}:`,
        currentFunction.equation
      );
      currentValue = evaluateExpression(currentFunction.equation, currentValue);
      console.log(`Result after Function ${currentFunctionId}:`, currentValue);

      if (currentFunction.nextFunction === -1) {
        setFinalOutput(currentValue);
        break;
      }
      currentFunctionId = currentFunction.nextFunction;
    }
  }, [functions, initialValue]);

  // Add effect to recalculate output when connections or initial value changes
  useEffect(() => {
    calculateOutput();
  }, [calculateOutput, functions, initialValue]);

  // Add this effect after other effects
  useEffect(() => {
    // Update on window resize
    const handleResize = () => updateDimensionsAndConnections();
    window.addEventListener("resize", handleResize);

    // Update on DOM mutations
    const mutationObserver = new MutationObserver(() => {
      updateDimensionsAndConnections();
    });

    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      mutationObserver.disconnect();
    };
  }, [updateDimensionsAndConnections]);

  return (
    <div
      className="relative flex justify-center items-center gap-8 bg-gray-50 mx-auto p-8 max-w-screen-2xl min-h-screen"
      ref={containerRef}
    >
      <div className="top-0 left-0 fixed bg-gray-50 w-full h-full">
        <Image
          src={background}
          alt="Background"
          layout="fill"
          objectFit="cover"
        />
      </div>
      {/* Main content */}
      <div className="relative z-10 flex items-center gap-8 w-full">
        {/* Initial Value */}
        <div className="flex flex-col items-center gap-2 mb-[174px] initial-value">
          <span className="bg-[#F5A524] px-4 py-2 rounded-3xl font-semibold text-white text-xs whitespace-nowrap">
            Initial value of x
          </span>
          <div className="relative flex items-center gap-4 border-[#F5A524] border-2 bg-white shadow-md rounded-2xl">
            <input
              aria-label="num"
              type="number"
              value={initialValue}
              onChange={(e) => setInitialValue(Number(e.target.value))}
              className="pl-4 max-w-[60px] font-bold text-2xl text-gray-800 outline-none"
            />
            <div className="border-[#F5A524] border-l w-10 h-12">
              <div className="top-1/2 right-4 absolute flex bg-blue-500 rounded-full w-2 h-2 -translate-y-1/2 outline outline-[#DBDBDB] outline-2 outline-offset-2 output-point" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-32 gap-y-20">
          {functions.map((funcDetail) => (
            <FunctionCard
              functions={functions}
              key={funcDetail.id}
              funcDetail={funcDetail}
              setFunctions={setFunctions}
            />
          ))}
        </div>

        {/* Final Output */}
        <div className="flex flex-col items-center gap-2 mb-[174px] final-output">
          <span className="bg-[#4CAF79] px-4 py-2 rounded-3xl font-semibold text-white text-xs whitespace-nowrap">
            Final Output y
          </span>
          <div className="relative flex items-center gap-4 border-[#4CAF79] border-2 bg-white shadow-md rounded-2xl">
            <div className="border-[#4CAF79] border-r w-10 h-12">
              <div className="top-1/2 left-3 absolute flex bg-blue-500 rounded-full w-2 h-2 -translate-y-1/2 input-point outline outline-[#DBDBDB] outline-2 outline-offset-2" />
            </div>
            <span className="pr-4 min-w-[60px] font-bold text-2xl text-gray-800">
              {finalOutput}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Layer */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={svgDimensions.width}
        height={svgDimensions.height}
        style={{ zIndex: 50 }}
      >
        {connections.map((conn, index) => (
          <path
            key={index}
            d={createPath(conn.start, conn.end, conn.isTerminal)}
            fill="none"
            stroke={COLORS.CONNECTION}
            strokeOpacity={FUNCTION_DEFAULTS.CONNECTION_OPACITY}
            strokeWidth={FUNCTION_DEFAULTS.CONNECTION_WIDTH}
            strokeLinecap="round"
            style={{ transition: "all 0.3s ease" }}
          />
        ))}
      </svg>
    </div>
  );
}
