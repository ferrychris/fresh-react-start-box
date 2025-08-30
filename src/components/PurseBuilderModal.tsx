import React, { useState } from 'react';
import { 
  Calculator, 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Target, 
  Users, 
  Calendar,
  Settings // Change Wrench to Settings as it's more commonly available
} from 'lucide-react';

interface PurseBuilderModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

interface Prize {
  place: number;
  amount: number;
}

export const PurseBuilderModal: React.FC<PurseBuilderModalProps> = ({ onClose, onSave }) => {
  const [eventName, setEventName] = useState('');
  const [totalPurse, setTotalPurse] = useState(1000);
  const [payoutStructure, setPayoutStructure] = useState<Prize[]>([
    { place: 1, amount: 500 },
    { place: 2, amount: 300 },
    { place: 3, amount: 200 },
  ]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [entryFee, setEntryFee] = useState(50);
  const [numRacers, setNumRacers] = useState(20);
  const [additionalExpenses, setAdditionalExpenses] = useState(100);

  const addPayoutRow = () => {
    setPayoutStructure([...payoutStructure, { place: payoutStructure.length + 1, amount: 0 }]);
  };

  const removePayoutRow = (index: number) => {
    const newPayoutStructure = [...payoutStructure];
    newPayoutStructure.splice(index, 1);
    setPayoutStructure(newPayoutStructure);
  };

  const updatePayoutAmount = (index: number, amount: number) => {
    const newPayoutStructure = [...payoutStructure];
    newPayoutStructure[index].amount = amount;
    setPayoutStructure(newPayoutStructure);
  };

  const calculateRemainingPurse = () => {
    const distributedAmount = payoutStructure.reduce((sum, prize) => sum + prize.amount, 0);
    return totalPurse - distributedAmount;
  };

  const saveAndClose = () => {
    const data = {
      eventName,
      totalPurse,
      payoutStructure,
      entryFee,
      numRacers,
      additionalExpenses,
    };
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Purse Builder</h2>
          <p className="text-gray-500 mt-2">Configure the event purse and payout structure.</p>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Event Name</label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Total Purse</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 pl-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter total purse amount"
                value={totalPurse}
                onChange={(e) => setTotalPurse(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-gray-600" />
              <span>Payout Structure</span>
            </h3>
            {payoutStructure.map((prize, index) => (
              <div key={index} className="flex items-center mb-2 space-x-2">
                <span className="w-8 text-center">{prize.place}.</span>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    className="shadow appearance-none border rounded w-full py-2 px-3 pl-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter amount"
                    value={prize.amount}
                    onChange={(e) => updatePayoutAmount(index, parseInt(e.target.value))}
                  />
                </div>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => removePayoutRow(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={addPayoutRow}
            >
              Add Payout Row
            </button>
            <div className="mt-2 text-gray-600">
              Remaining Purse: ${calculateRemainingPurse()}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Advanced Settings</h3>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Entry Fee</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 pl-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter entry fee amount"
                value={entryFee}
                onChange={(e) => setEntryFee(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Number of Racers</label>
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="number"
              className="shadow appearance-none border rounded w-full py-2 px-3 pl-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter number of racers"
              value={numRacers}
              onChange={(e) => setNumRacers(parseInt(e.target.value))}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Additional Expenses</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 pl-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter additional expenses"
                value={additionalExpenses}
                onChange={(e) => setAdditionalExpenses(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
