import { useState } from 'react';
import { FaExchangeAlt, FaFire, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';

export interface Transaction {
  transactionId: string;
  timestamp: string;
  fromWallet: string;
  toWallet: string;
  tokenAmount: number;
  transactionType: 'Transfer' | 'Mint' | 'Burn';
  gameName: string;
  status: 'Success' | 'Pending' | 'Failed';
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof Transaction>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getTransactionTypeIcon = (type: Transaction['transactionType']) => {
    switch (type) {
      case 'Transfer':
        return <FaExchangeAlt className="text-blue-400" />;
      case 'Mint':
        return <FaPlus className="text-green" />;
      case 'Burn':
        return <FaFire className="text-red-500" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'Success':
        return 'text-green';
      case 'Pending':
        return 'text-yellow-500';
      case 'Failed':
        return 'text-red-500';
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, HH:mm');
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortField === 'timestamp') {
      return sortDirection === 'desc' 
        ? new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime()
        : new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
    }
    
    if (a[sortField] < b[sortField]) return sortDirection === 'desc' ? 1 : -1;
    if (a[sortField] > b[sortField]) return sortDirection === 'desc' ? -1 : 1;
    return 0;
  });

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="p-4 text-gray-400 font-medium">
                <button 
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center gap-2 hover:text-white"
                >
                  Time
                </button>
              </th>
              <th className="p-4 text-gray-400 font-medium">Type</th>
              <th className="p-4 text-gray-400 font-medium">Game</th>
              <th className="p-4 text-gray-400 font-medium">From</th>
              <th className="p-4 text-gray-400 font-medium">To</th>
              <th className="p-4 text-gray-400 font-medium text-right">
                <button 
                  onClick={() => handleSort('tokenAmount')}
                  className="flex items-center gap-2 hover:text-white ml-auto"
                >
                  Amount
                </button>
              </th>
              <th className="p-4 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => (
              <tr 
                key={tx.transactionId} 
                className="border-b border-white/5 hover:bg-white/5"
              >
                <td className="p-4 text-white">
                  {formatDate(tx.timestamp)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getTransactionTypeIcon(tx.transactionType)}
                    <span className="text-white">{tx.transactionType}</span>
                  </div>
                </td>
                <td className="p-4 text-white">{tx.gameName}</td>
                <td className="p-4 text-gray-400 font-mono">
                  {truncateAddress(tx.fromWallet)}
                </td>
                <td className="p-4 text-gray-400 font-mono">
                  {truncateAddress(tx.toWallet)}
                </td>
                <td className="p-4 text-white text-right">
                  {tx.tokenAmount.toLocaleString()}
                </td>
                <td className={`p-4 ${getStatusColor(tx.status)}`}>
                  {tx.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {sortedTransactions.map((tx) => (
          <div 
            key={tx.transactionId}
            className="bg-black/50 p-4 rounded-lg space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTransactionTypeIcon(tx.transactionType)}
                  <span className="text-white">{tx.transactionType}</span>
                </div>
                <p className="text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                {tx.status}
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-400">Game</p>
                <p className="text-white">{tx.gameName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">From</p>
                  <p className="text-white font-mono text-sm">{truncateAddress(tx.fromWallet)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">To</p>
                  <p className="text-white font-mono text-sm">{truncateAddress(tx.toWallet)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-white font-medium">{tx.tokenAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 