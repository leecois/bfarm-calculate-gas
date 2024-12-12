"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Info, Calculator, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DetailedGasCalculator = () => {
  const [selectedDataType, setSelectedDataType] = useState("custom");
  const [state, setState] = useState({
    clauses: 1,
    zeroBytes: 0,
    nonZeroBytes: 0,
    vmGas: 0,
    gasPriceCoef: 0,
    isContractCreation: false,
  });

  const [results, setResults] = useState<{
    intrinsicGas: {
      txGas: number;
      clauseGas: number;
      dataGas: number;
      total: number;
    };
    vmGas: {
      userDefined: number;
      contractCall: number;
      total: number;
    };
    gasPrice: {
      base: number;
      additional: number;
      total: number;
    };
    totalGas: number;
    vthoAmount: number;
  } | null>(null);

  // Constants from documentation
  const constants = {
    TX_GAS: 5000,
    CLAUSE_GAS: 16000,
    CLAUSE_GAS_CONTRACT_CREATION: 48000,
    ZERO_BYTES_GAS: 4,
    NON_ZERO_BYTES_GAS: 68,
    VM_CALL_GAS: 15000,
    BASE_GAS_PRICE: 1e13, // 10,000,000,000,000
  };

  const commonDataSizes = {
    text: {
      zero: 0,
      nonZero: 1,
      description: "Văn bản (1 byte/ký tự)",
    },
    date: {
      zero: 2,
      nonZero: 8,
      description: "Ngày tháng (10 bytes)",
    },
    number: {
      zero: 2,
      nonZero: 2,
      description: "Số (4 bytes)",
    },
    hash: {
      zero: 0,
      nonZero: 32,
      description: "Hash (32 bytes)",
    },
    custom: {
      zero: 0,
      nonZero: 0,
      description: "Tùy chỉnh",
    },
  };

  type DataType = keyof typeof commonDataSizes;

  const handleDataTypeChange = (type: DataType) => {
    setSelectedDataType(type);
    if (type !== "custom") {
      setState((prev) => ({
        ...prev,
        zeroBytes: commonDataSizes[type].zero,
        nonZeroBytes: commonDataSizes[type].nonZero,
      }));
    }
  };

  const priorityLevels = [
    {
      name: "Regular",
      coef: 0,
      color: "text-blue-500",
    },
    {
      name: "Medium",
      coef: 85,
      color: "text-green-500",
    },
    {
      name: "High",
      coef: 255,
      color: "text-orange-500",
    },
  ];

  const calculatePriorityVTHO = (totalGas: number) => {
    return priorityLevels.map((level) => ({
      ...level,
      vtho: ((totalGas / 100000) * (1 + level.coef / 255)).toFixed(2),
    }));
  };

  const calculateGas = () => {
    // Calculate intrinsic gas
    const clauseGas = state.isContractCreation
      ? constants.CLAUSE_GAS_CONTRACT_CREATION
      : constants.CLAUSE_GAS;

    const dataGas =
      state.zeroBytes * constants.ZERO_BYTES_GAS +
      state.nonZeroBytes * constants.NON_ZERO_BYTES_GAS;

    const intrinsicGas = constants.TX_GAS + clauseGas * state.clauses + dataGas;

    // Calculate VM gas
    const totalVMGas =
      Number(state.vmGas) +
      (state.isContractCreation ? constants.VM_CALL_GAS : 0);

    // Calculate total gas
    const totalGas = intrinsicGas + totalVMGas;

    // Calculate VTHO cost with correct formula
    const coefficient = 1 + state.gasPriceCoef / 255;
    const vthoAmount = (totalGas / 100000) * coefficient;

    setResults({
      intrinsicGas: {
        txGas: constants.TX_GAS,
        clauseGas: clauseGas * state.clauses,
        dataGas,
        total: intrinsicGas,
      },
      vmGas: {
        userDefined: Number(state.vmGas),
        contractCall: state.isContractCreation ? constants.VM_CALL_GAS : 0,
        total: totalVMGas,
      },
      gasPrice: {
        base: constants.BASE_GAS_PRICE,
        additional: constants.BASE_GAS_PRICE * (state.gasPriceCoef / 255),
        total: constants.BASE_GAS_PRICE * coefficient,
      },
      totalGas,
      vthoAmount,
    });
  };

  const DataSizeTooltip = ({
    // title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger type="button">
          <HelpCircle className="h-4 w-4 ml-1" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            <CardTitle>Tính Toán Chi Tiết Gas VeChain</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium">Số lượng Clause</label>
                <DataSizeTooltip
                  title="Clause"
                  description="Số lượng thao tác trong một giao dịch. Mỗi clause tiêu tốn 16,000 gas."
                />
              </div>
              <Input
                type="number"
                min="1"
                value={state.clauses}
                onChange={(e) =>
                  setState({ ...state, clauses: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium">Loại dữ liệu</label>
                <DataSizeTooltip
                  title="Data Type"
                  description="Chọn loại dữ liệu để tự động điền số bytes"
                />
              </div>
              <Select
                value={selectedDataType}
                onValueChange={handleDataTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại dữ liệu" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(commonDataSizes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium">Số byte bằng 0</label>
                <DataSizeTooltip
                  title="Zero Bytes"
                  description="Mỗi byte 0 tiêu tốn 4 gas. Thường gặp trong padding và dữ liệu trống."
                />
              </div>
              <Input
                type="number"
                min="0"
                value={state.zeroBytes}
                onChange={(e) =>
                  setState({ ...state, zeroBytes: Number(e.target.value) })
                }
                disabled={selectedDataType !== "custom"} // Disable khi không ở chế độ tùy chỉnh
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium">Số byte khác 0</label>
                <DataSizeTooltip
                  title="Non-zero Bytes"
                  description="Mỗi byte khác 0 tiêu tốn 68 gas. Thường là dữ liệu thực tế."
                />
              </div>
              <Input
                type="number"
                min="0"
                value={state.nonZeroBytes}
                onChange={(e) =>
                  setState({ ...state, nonZeroBytes: Number(e.target.value) })
                }
                disabled={selectedDataType !== "custom"} // Disable khi không ở chế độ tùy chỉnh
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium">VM Gas</label>
                <DataSizeTooltip
                  title="VM Gas"
                  description="Gas cho việc thực thi smart contract. Thông thường từ 21,000 cho giao dịch đơn giản."
                />
              </div>
              <Input
                type="number"
                min="0"
                value={state.vmGas}
                onChange={(e) =>
                  setState({ ...state, vmGas: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium">
                  Hệ số Gas Price (0-255)
                </label>
                <DataSizeTooltip
                  title="Gas Price Coefficient"
                  description="Hệ số ảnh hưởng đến ưu tiên giao dịch. 0 = không ưu tiên, 255 = ưu tiên cao nhất."
                />
              </div>
              <Input
                type="number"
                min="0"
                max="255"
                value={state.gasPriceCoef}
                onChange={(e) =>
                  setState({ ...state, gasPriceCoef: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="contractCreation"
                checked={state.isContractCreation}
                onChange={(e) =>
                  setState({ ...state, isContractCreation: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="contractCreation" className="text-sm font-medium">
                Tạo hợp đồng mới
              </label>
              <DataSizeTooltip
                title="Contract Creation"
                description="Tạo hợp đồng mới tiêu tốn 48,000 gas thay vì 16,000 gas cho clause thông thường."
              />
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">Ước tính kích thước dữ liệu phổ biến:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Văn bản: 1 byte/ký tự</li>
                <li>• Ngày tháng: ~10 bytes</li>
                <li>• Số: 4-8 bytes</li>
                <li>• Hash: 32 bytes</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button onClick={calculateGas} className="w-full">
            Tính Toán
          </Button>

          {/* Results Section */}
          {results && (
            <div className="space-y-4">
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Intrinsic Gas</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      Gas giao dịch:{" "}
                      {results.intrinsicGas.txGas.toLocaleString()}
                    </p>
                    <p>
                      Gas clause:{" "}
                      {results.intrinsicGas.clauseGas.toLocaleString()}
                    </p>
                    <p>
                      Gas dữ liệu:{" "}
                      {results.intrinsicGas.dataGas.toLocaleString()}
                    </p>
                    <p className="font-medium">
                      Tổng: {results.intrinsicGas.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">VM Gas</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      Gas người dùng:{" "}
                      {results.vmGas.userDefined.toLocaleString()}
                    </p>
                    <p>
                      Gas gọi hợp đồng:{" "}
                      {results.vmGas.contractCall.toLocaleString()}
                    </p>
                    <p className="font-medium">
                      Tổng: {results.vmGas.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <h3 className="font-medium">
                      Ước tính chi phí theo độ ưu tiên
                    </h3>
                    <DataSizeTooltip
                      title="Priority Levels"
                      description="Regular: Giao dịch thông thường
  Medium: Ưu tiên trung bình, xử lý nhanh hơn
  High: Ưu tiên cao nhất, xử lý nhanh nhất"
                    />
                  </div>
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                    {calculatePriorityVTHO(results.totalGas).map((level) => (
                      <div key={level.name} className="p-3 border rounded-md">
                        <div className="font-medium mb-1">{level.name}</div>
                        <div className={`${level.color} font-bold`}>
                          {level.vtho} VTHO
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          GasPriceCoef: {level.coef}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * 1 VTHO = 100,000 gas
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Kết quả cuối cùng:</p>
                    <p>Tổng Gas: {results.totalGas.toLocaleString()}</p>
                    <p>Chi phí VTHO: {results.vthoAmount.toFixed(6)} VTHO</p>
                    <p className="text-xs text-gray-500 mt-2">
                      * Công thức: VTHO = Tổng Gas × (1 + gasPriceCoef/255)
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedGasCalculator;
