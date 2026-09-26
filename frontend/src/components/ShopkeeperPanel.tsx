import React, { useState } from 'react'
import { MessageSquare, Bot, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'

export interface Item {
  id: string
  title: string
  category: string
  size: string
  grade: string
  cost_basis: number
  list_price: number
  floor_price: number
  status: 'listed' | 'reserved' | 'sold'
  photo_urls: string[]
}

export interface RetailSale {
  id: string
  item_id: string
  channel: string
  sale_price: number
  cost_basis: number
  gross_profit: number
  buyer_identifier: string
  created_at: string
}

interface ShopkeeperPanelProps {
  items: Item[]
  sales: RetailSale[]
  onRefresh: () => void
}

export default function ShopkeeperPanel({ items, sales, onRefresh }: ShopkeeperPanelProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'whatsapp' | 'bot'>('inventory')
  const [customerMsg, setCustomerMsg] = useState('Can you do £34 for the W30 501s?')
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'user', text: "Hey! Looking for Grade A Levi's 501 in waist 30." },
    { role: 'bot', text: "Hey! We've got authentic vintage Levi's 501s in W30 L32 listed at £38. Condition is verified Grade A with natural wash wear!" },
  ])
  const [isSimulating, setIsSimulating] = useState(false)

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.sale_price), 0)
  const totalProfit = sales.reduce((acc, s) => acc + Number(s.gross_profit), 0)
  const activeItems = items.filter((i) => i.status === 'listed')
  const soldItems = items.filter((i) => i.status === 'sold')

  async function handleSendWhatsAppOffer(offerPrice: number) {
    if (activeItems.length === 0) return
    const targetItem = activeItems[0]
    setIsSimulating(true)

    setChatLog((prev) => [...prev, { role: 'user', text: `Would you take £${offerPrice}?` }])

    setTimeout(async () => {
      const floor = Number(targetItem.floor_price)
      const list = Number(targetItem.list_price)

      if (offerPrice >= list) {
        setChatLog((prev) => [
          ...prev,
          { role: 'bot', text: `Deal! Setting it aside for you at £${list}. Here's your checkout link!` },
        ])
        await executeSale(targetItem, offerPrice, 'whatsapp', '+447911234567')
      } else if (offerPrice >= floor) {
        setChatLog((prev) => [
          ...prev,
          { role: 'bot', text: `You've got a deal at £${offerPrice}! Order confirmed and being prepared.` },
        ])
        await executeSale(targetItem, offerPrice, 'whatsapp', '+447911234567')
      } else {
        setChatLog((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `That's below our cost margin (£${floor} floor). The lowest bottom price today is £${Math.ceil(floor)}.`,
          },
        ])
      }
      setIsSimulating(false)
      onRefresh()
    }, 600)
  }

  async function handleBotStorefrontSale() {
    if (activeItems.length === 0) return
    const targetItem = activeItems[activeItems.length > 1 ? 1 : 0]
    setIsSimulating(true)

    const botOffer = Math.round(Number(targetItem.list_price) * 0.9)
    await executeSale(targetItem, botOffer, 'agent_storefront', 'grok_agent_buyer_09')
    setIsSimulating(false)
    onRefresh()
  }

  async function executeSale(item: Item, price: number, channel: string, buyer: string) {
    const profit = Number((price - Number(item.cost_basis)).toFixed(2))

    await supabase.from('items').update({ status: 'sold' }).eq('id', item.id)

    await supabase.from('retail_sales').insert({
      item_id: item.id,
      channel,
      sale_price: price,
      cost_basis: item.cost_basis,
      gross_profit: profit,
      buyer_identifier: buyer,
      payment_reference: `sim_pay_${Date.now()}`,
    })
  }

  return (
    <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-ink-raised/60 p-6 backdrop-blur shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Shopkeeper Retail Engine</h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Autonomous Resale Channel
              </span>
            </div>
            <p className="text-xs text-white/50">
              Purchased wholesale lots are automatically graded, cataloged, and negotiated over WhatsApp and Bot Storefront.
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-4 text-right">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Active Listings</div>
            <div className="text-lg font-bold text-white">{activeItems.length} pcs</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Retail Revenue</div>
            <div className="text-lg font-bold text-emerald-400">£{totalRevenue.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
            <div className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Gross Profit</div>
            <div className="text-lg font-bold text-emerald-400">+£{totalProfit.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'inventory' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Tag className="h-4 w-4" />
            Live Catalog ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/50 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp Sales Agent
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'bot' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-white/50 hover:text-white'
            }`}
          >
            <Bot className="h-4 w-4" />
            Agent Storefront (Bot-to-Bot)
          </button>
        </div>

        {items.length === 0 && (
          <span className="text-xs text-amber-400 animate-pulse">
            Waiting for Counter to buy wholesale lots to auto-catalog items...
          </span>
        )}
      </div>

      {/* Tab 1: Live Catalog */}
      {activeTab === 'inventory' && (
        <div className="mt-5">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/40">
              No retail items cataloged yet. Submit a demand above or trigger an autonomous wholesale buy!
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition ${
                    item.status === 'sold'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded bg-white/10 px-2 py-0.5 text-xs font-mono text-white/80">
                        {item.size}
                      </span>
                      <span className="ml-2 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/20">
                        Grade {item.grade}
                      </span>
                    </div>
                    {item.status === 'sold' ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/40">
                        SOLD
                      </span>
                    ) : (
                      <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
                        LISTED
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-white line-clamp-1">{item.title}</h3>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <div>
                      <span className="text-white/40">Cost Basis: </span>
                      <span className="font-mono text-white/70">£{item.cost_basis}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Floor: </span>
                      <span className="font-mono text-rose-300">£{item.floor_price}</span>
                    </div>
                    <div>
                      <span className="text-white/40">List Price: </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">£{item.list_price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: WhatsApp Agent Live Negotiator */}
      {activeTab === 'whatsapp' && (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* Chat Window */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                WhatsApp Channel Live Thread (+44 7911 234567)
              </span>
            </div>
            <div className="my-4 flex-1 space-y-3 overflow-y-auto max-h-60 text-sm pr-2">
              {chatLog.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      chat.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white/10 text-white/90 rounded-bl-none border border-white/10'
                    }`}
                  >
                    {chat.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-3">
              <button
                disabled={isSimulating || activeItems.length === 0}
                onClick={() => handleSendWhatsAppOffer(34)}
                className="flex-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
              >
                Simulate Offer: £34 (Acceptable)
              </button>
              <button
                disabled={isSimulating || activeItems.length === 0}
                onClick={() => handleSendWhatsAppOffer(18)}
                className="flex-1 rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition disabled:opacity-50"
              >
                Simulate Low-Ball: £18 (Below Floor)
              </button>
            </div>
          </div>

          {/* Floor Guard Explainer */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="h-5 w-5" />
                Floor-Guarded Negotiation Logic
              </div>
              <p className="mt-2 text-xs text-white/60 leading-relaxed">
                The Shopkeeper WhatsApp Bot dynamically queries active Supabase inventory. It has full authority to negotiate discounts with human shoppers, but operates under a cryptographic margin policy:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-white/80">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Target Margin: ~55% gross margin (List price)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>Secret Floor: 30% absolute minimum margin (Never breached)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Concession: Midpoint counteroffer when customer is within 15%</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-lg bg-black/30 border border-white/5 p-3 text-xs font-mono text-white/50">
              Active Floor Rule: cost_basis (£{activeItems[0]?.cost_basis || 17}) / (1 - 0.30) = £{activeItems[0]?.floor_price || 24.29} min.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Agent Storefront (Bot-to-Bot) */}
      {activeTab === 'bot' && (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
                Machine-Readable Manifest
              </span>
              <span className="font-mono text-[11px] text-white/40">/.well-known/agent-store.json</span>
            </div>
            <pre className="mt-3 overflow-x-auto text-[11px] font-mono text-sky-200/90 leading-tight">
{JSON.stringify(
  {
    name: "Vintage Threads London",
    currency: "GBP",
    categories: ["Levi's 501", "Vintage Denim"],
    tools: ["search_catalog", "make_offer", "checkout"],
    policy: {
      returns: "14-day authenticated return guarantee",
      shipping: "Royal Mail 48 Tracked"
    }
  },
  null,
  2
)}
            </pre>
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                disabled={isSimulating || activeItems.length === 0}
                onClick={handleBotStorefrontSale}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500/20 border border-sky-500/30 px-4 py-2.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition disabled:opacity-50"
              >
                <Bot className="h-4 w-4" />
                Simulate External Buying Agent Transaction (make_offer & checkout)
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h4 className="text-sm font-semibold text-white">Bot-to-Bot Autonomous Commerce</h4>
            <p className="mt-2 text-xs text-white/60 leading-relaxed">
              When an external agent (such as Grok or Diba) accesses this merchant, it avoids human UI friction entirely by interacting through standardized tools:
            </p>
            <div className="mt-4 space-y-2 text-xs text-white/70">
              <div className="rounded border border-white/5 bg-black/20 p-2.5 font-mono">
                1. search_catalog(size="30", category="Levi's 501")
              </div>
              <div className="rounded border border-white/5 bg-black/20 p-2.5 font-mono">
                2. make_offer(itemId, price, agentId)
              </div>
              <div className="rounded border border-white/5 bg-black/20 p-2.5 font-mono">
                3. checkout(itemId, paymentToken)
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
