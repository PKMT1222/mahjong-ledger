'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FadeIn } from '@/components/AnimatedElements';

interface Player {
  id: number;
  name: string;
  seat_position: number;
  final_score: number;
  is_dealer: boolean;
}

interface Payment {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseValue, setBaseValue] = useState(10); // Base points per dollar
  const [showDecimals, setShowDecimals] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  async function fetchGameData() {
    setLoading(true);
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const games = await res.json();
        const g = games.find((ga: any) => ga.id === parseInt(gameId));
        if (g) {
          setGame(g);
          setPlayers(g.players || []);
          // Get base value from game settings
          if (g.settings?.basePoints) {
            setBaseValue(g.settings.basePoints);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching game:', error);
    }
    setLoading(false);
  }

  // Calculate money from points
  function calculateMoney(points: number): number {
    const money = points / baseValue;
    return showDecimals ? Math.round(money * 100) / 100 : Math.round(money);
  }

  // Calculate payments using netting algorithm
  function calculatePayments(): Payment[] {
    const playerMoney = players.map(p => ({
      name: p.name,
      money: calculateMoney(p.final_score)
    }));

    const winners = playerMoney.filter(p => p.money > 0).sort((a, b) => b.money - a.money);
    const losers = playerMoney.filter(p => p.money < 0).sort((a, b) => a.money - b.money);
    
    const payments: Payment[] = [];
    
    while (winners.length > 0 && losers.length > 0) {
      const winner = winners[0];
      const loser = losers[0];
      
      const amount = Math.min(winner.money, -loser.money);
      
      if (amount > 0) {
        payments.push({
          from: loser.name,
          to: winner.name,
          amount: showDecimals ? Math.round(amount * 100) / 100 : Math.round(amount)
        });
      }
      
      winner.money -= amount;
      loser.money += amount;
      
      if (winner.money <= 0.01) winners.shift();
      if (loser.money >= -0.01) losers.shift();
    }
    
    return payments;
  }

  async function saveToHistory() {
    try {
      const res = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(gameId),
          status: 'completed',
          settings: {
            ...game?.settings,
            finalSettlement: {
              baseValue,
              players: players.map(p => ({
                name: p.name,
                points: p.final_score,
                money: calculateMoney(p.final_score)
              })),
              payments: calculatePayments()
            }
          }
        })
      });
      
      if (res.ok) {
        setSaved(true);
        alert('✅ 牌局已保存到歷史');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      alert('❌ 保存失敗');
    }
  }

  function shareResults() {
    const playerMoney = players.map(p => ({
      name: p.name,
      money: calculateMoney(p.final_score)
    }));
    
    const payments = calculatePayments();
    
    const text = `🀄 麻雀結算單\n\n` +
      `牌局：${game?.name}\n` +
      `日期：${new Date().toLocaleDateString('zh-HK')}\n` +
      `底分：${baseValue} 分 = $1\n\n` +
      `📊 最終分數：\n` +
      playerMoney.map(p => `${p.name}: ${p.money > 0 ? '+' : ''}$${p.money}`).join('\n') +
      `\n\n💰 找數：\n` +
      (payments.length > 0 
        ? payments.map(p => `${p.from} 支付 ${p.to} $${p.amount}`).join('\n')
        : '無需找數');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ 結算單已複製到剪貼簿');
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">牌局不存在</p>
      </div>
    );
  }

  const payments = calculatePayments();
  const totalWin = players.reduce((sum, p) => sum + (p.final_score > 0 ? p.final_score : 0), 0);
  const totalLoss = players.reduce((sum, p) => sum + (p.final_score < 0 ? p.final_score : 0), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-700 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href={`/game/${gameId}`} className="text-white text-lg">←</Link>
          <h1 className="text-xl font-bold">💰 結束找數</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Game Info */}
        <FadeIn>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold text-lg mb-1">{game.name}</h2>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-HK')}</p>
            
            {/* Base Value Setting */}
            <div className="mt-3 flex items-center gap-3">
              <label className="text-sm text-gray-600">底分：</label>
              <input
                type="number"
                value={baseValue}
                onChange={(e) => setBaseValue(parseInt(e.target.value) || 10)}
                className="w-20 px-2 py-1 border rounded text-center"
                min={1}
              />
              <span className="text-sm text-gray-500">分 = $1</span>
            </div>
            
            {/* Show Decimals Toggle */}
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={showDecimals}
                onChange={(e) => setShowDecimals(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600">顯示小數</span>
            </label>
          </div>
        </FadeIn>

        {/* Final Scores */}
        <FadeIn delay={100}>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-3">📊 最終分數</h3>
            <div className="space-y-2">
              {players.sort((a, b) => b.final_score - a.final_score).map((player, i) => {
                const money = calculateMoney(player.final_score);
                return (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•'}
                      </span>
                      <span className="font-medium">{player.name}</span>
                      {player.is_dealer && <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">莊</span>}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${money >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {money > 0 ? '+' : ''}${money}
                      </div>
                      <div className="text-xs text-gray-400">{player.final_score}分</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Totals */}
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-gray-500">總贏分：{totalWin}</span>
              <span className="text-gray-500">總輸分：{totalLoss}</span>
            </div>
          </div>
        </FadeIn>

        {/* Payment Summary */}
        <FadeIn delay={200}>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-3">💰 找數一覽</h3>
            {payments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">🎉 無需找數，大家平手！</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{payment.from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium">{payment.to}</span>
                    </div>
                    <span className="font-bold text-green-600">${payment.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Action Buttons */}
        <FadeIn delay={300}>
          <div className="space-y-3">
            <button
              onClick={shareResults}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold btn-ripple"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              📋 複製結算單
            </button>
            
            {!saved ? (
              <button
                onClick={saveToHistory}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold btn-ripple"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                ✅ 保存到歷史
              </button>
            ) : (
              <Link
                href="/"
                className="block w-full bg-gray-600 text-white py-4 rounded-lg font-bold text-center btn-press"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                🏠 返回主頁
              </Link>
            )}
          </div>
        </FadeIn>

        {/* Simple Receipt Preview */}
        <FadeIn delay={400}>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <h4 className="font-bold mb-2">🧾 簡易收據</h4>
            <pre className="whitespace-pre-wrap text-gray-700">
              {`牌局：${game.name}
日期：${new Date().toLocaleDateString('zh-HK')}
底分：${baseValue}分 = $1

${players.map(p => `${p.name}: ${calculateMoney(p.final_score) > 0 ? '+' : ''}$${calculateMoney(p.final_score)}`).join('\n')}

${payments.length > 0 ? '找數：\n' + payments.map(p => `${p.from}→${p.to} $${p.amount}`).join('\n') : '無需找數'}`}
            </pre>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
