import { useSendTransaction, useAccount } from 'wagmi';
import { useBlnkRiskAssessment } from '@blnk/wagmi-plugin';
import { parseEther } from 'viem';

function SwapComponent() {
  const { address } = useAccount();
  const { assessRisk, riskScore, isAssessing, error } = useBlnkRiskAssessment();
  const { sendTransaction } = useSendTransaction();

  const handleSwap = async () => {
    // 1. Risk assessment (automatic with plugin)
    const risk = await assessRisk({
      token: '0x...',
      actionType: 'swap',
      amount: '1.0'
    });

    if (risk.decision === 'BLOCK') {
      alert('Transaction blocked due to high risk');
      return;
    }

    if (risk.decision === 'WARN') {
      const proceed = confirm('Risk detected. Proceed anyway?');
      if (!proceed) return;
    }

    // 2. Proceed with transaction
    sendTransaction({
      to: '0x...',
      value: parseEther('1.0')
    });
  };

  return (
    <div>
      {isAssessing && <span>Assessing risk...</span>}
      {riskScore && <span>Risk Score: {riskScore}/100</span>}
      {error && <span>Error: {error.message}</span>}
      <button onClick={handleSwap}>Swap</button>
    </div>
  );
}

export default SwapComponent;