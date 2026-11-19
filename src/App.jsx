import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, BadgeIndianRupee, Bell, CalendarDays,
  Check, ChevronDown, ChevronRight, CircleHelp, Copy, CreditCard,
  Gem, LayoutDashboard, LogOut, Menu, Plus, RefreshCw, Search,
  Settings, ShieldCheck, Sparkles, TrendingDown, TrendingUp, Users,
  Wallet, X, ArrowLeftRight, PieChart, Target, ReceiptText, Clock3
} from 'lucide-react'
import { isConfigured, supabase } from './lib/supabase'

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
const today = () => new Date().toISOString().slice(0,10)
const initials = s => (s || 'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const categories = ['Food','Transport','Shopping','Education','Hostel','Entertainment','Healthcare','Bills','Other']
const uid = () => crypto.randomUUID()

function forecast(transactions, openingBalance=0) {
  const sorted = [...transactions].sort((a,b)=>a.txn_date.localeCompare(b.txn_date))
  const income = sorted.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0)
  const expenses = sorted.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0)
  const balance = Number(openingBalance) + income - expenses
  const recent = sorted.filter(t=>t.type==='expense').slice(-14)
  const avg = recent.length ? recent.reduce((s,t)=>s+Number(t.amount),0) / Math.max(1, new Set(recent.map(t=>t.txn_date)).size) : 0
  const day = new Date().getDate()
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() - day
  const daily = avg || (expenses / Math.max(day,1))
  return { income, expenses, balance, daily, daysLeft, predicted: balance - daily*daysLeft, depletion: daily > 0 && balance > 0 ? Math.ceil(balance/daily) : null }
}

function Auth({ onAuth }) {
  const [mode,setMode]=useState('login')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [name,setName]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function submit(e){
    e.preventDefault(); setBusy(true); setError('')
    try {
      if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}})
        if(error) throw error
        if(data.session) onAuth(data.session.user)
        else setError('Account created. Check your email to confirm, then sign in.')
      } else {
        const {data,error}=await supabase.auth.signInWithPassword({email,password})
        if(error) throw error
        onAuth(data.user)
      }
    } catch(err){setError(err.message || 'Something went wrong')}
    finally{setBusy(false)}
  }
  return <div className="auth-shell">
    <div className="auth-art">
      <div className="auth-stamp">RS / 01</div>
      <div className="auth-quote">A little<br/><em>more sense.</em><br/>A lot more freedom.</div>
      <p className="auth-caption">A considered approach to everyday money.</p>
      <div className="auth-orbit"><span>â‚¹</span><i>RUPEESENSE</i></div>
    </div>
    <div className="auth-panel">
      <div className="brand"><span className="brand-mark">R</span><span>RUPEESENSE<small>THE ART OF MONEY</small></span></div>
      <div className="eyebrow">YOUR FINANCIAL COMPANION</div>
      <h1>{mode==='login'?'Welcome back.':'A better money story starts here.'}</h1>
      <p className="muted">{mode==='login'?'Sign in to your private financial journal.':'Create an account to begin your financial journey.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode==='signup' && <label>Your name<input value={name} onChange={e=>setName(e.target.value)} required placeholder="e.g. Deepthi Korrapati"/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required placeholder="At least 6 characters"/></label>
        {error && <div className="notice">{error}</div>}
        <button className="btn btn-dark full" disabled={busy}>{busy?'Please waitâ€¦':mode==='login'?'Sign in':'Create account'} <ChevronRight size={16}/></button>
      </form>
      <p className="switch-auth">{mode==='login'?"New to RupeeSense?":"Already have an account?"} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode==='login'?'Create an account':'Sign in'}</button></p>
      <div className="auth-foot"><ShieldCheck size={14}/> Your financial data is private to your account.</div>
    </div>
  </div>
}

function App(){
  const [session,setSession]=useState(null)
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState('Overview')
  const [transactions,setTransactions]=useState([])
  const [rooms,setRooms]=useState([])
  const [selectedRoom,setSelectedRoom]=useState(null)
  const [roomMembers,setRoomMembers]=useState([])
  const [roomExpenses,setRoomExpenses]=useState([])
  const [roomSplits,setRoomSplits]=useState([])
  const [payments,setPayments]=useState([])
  const [profile,setProfile]=useState(null)
  const [modal,setModal]=useState('')
  const [toast,setToast]=useState('')
  const [busy,setBusy]=useState(false)
  const [search,setSearch]=useState('')
  const [filter,setFilter]=useState('all')
  const [openingBalance,setOpeningBalance]=useState(0)

  useEffect(()=>{
    if(!isConfigured){setLoading(false);return}
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{setSession(s);setLoading(false)})
    return ()=>subscription.unsubscribe()
  },[])
  useEffect(()=>{if(session?.user) loadAll()},[session?.user?.id])
  useEffect(()=>{
    if(session?.user){
      const code=new URLSearchParams(window.location.search).get('join')
      if(code){setModal('join')}
    }
  },[session?.user?.id])
  useEffect(()=>{if(selectedRoom) loadRoom(selectedRoom.id)},[selectedRoom?.id])
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),3200);return ()=>clearTimeout(t)}},[toast])

  async function loadAll(){
    const user=session?.user
    if(!user) return
    const [tx,mem,prof]=await Promise.all([
      supabase.from('personal_transactions').select('*').eq('user_id',user.id).order('txn_date',{ascending:false}),
      supabase.from('room_members').select('room_id').eq('user_id',user.id),
      supabase.from('profiles').select('*').eq('id',user.id).maybeSingle()
    ])
    if(tx.error) setToast(tx.error.message); else setTransactions(tx.data||[])
    if(prof.data) setProfile(prof.data)
    const ids=(mem.data||[]).map(x=>x.room_id)
    if(ids.length){
      const {data}=await supabase.from('rooms').select('*').in('id',ids).order('created_at',{ascending:false})
      setRooms(data||[])
    } else setRooms([])
  }
  async function loadRoom(id){
    const [m,e,p]=await Promise.all([
      supabase.from('room_members').select('user_id,role,profiles(id,full_name,email,upi_id)').eq('room_id',id),
      supabase.from('group_expenses').select('*,expense_splits(*)').eq('room_id',id).order('expense_date',{ascending:false}),
      supabase.from('settlement_payments').select('*').eq('room_id',id)
    ])
    if(m.error) setToast(m.error.message)
    setRoomMembers(m.data||[])
    setRoomExpenses(e.data||[])
    setPayments(p.data||[])
  }
  async function refresh(){await loadAll();if(selectedRoom) await loadRoom(selectedRoom.id)}
  async function signOut(){await supabase.auth.signOut();setSession(null)}
  const user=session?.user
  const displayName=profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const stats=useMemo(()=>forecast(transactions,openingBalance),[transactions,openingBalance])
  const filtered=transactions.filter(t=>(filter==='all'||t.type===filter) && (t.title+' '+t.category).toLowerCase().includes(search.toLowerCase()))
  const ownRoomRole=selectedRoom && roomMembers.find(m=>m.user_id===user?.id)?.role

  async function addTransaction(form){
    setBusy(true)
    const {error}=await supabase.from('personal_transactions').insert({type:form.type,title:form.title,amount:Number(form.amount),category:form.category,txn_date:form.txn_date,payment_method:form.payment_method,description:form.description||null,user_id:user.id})
    setBusy(false)
    if(error) return setToast(error.message)
    setModal('');setToast('Transaction saved');await loadAll()
  }
  async function createRoom(form){
    setBusy(true)
    const code=Math.random().toString(36).slice(2,9).toUpperCase()
    const {data,error}=await supabase.from('rooms').insert({...form,created_by:user.id,invite_code:code}).select().single()
    if(error){setBusy(false);return setToast(error.message)}
    const {error:memberError}=await supabase.from('room_members').insert({room_id:data.id,user_id:user.id,role:'owner'})
    setBusy(false)
    if(memberError) return setToast(memberError.message)
    setModal('');setToast('Your room is ready');await loadAll();setSelectedRoom(data);setTab('Expense Rooms')
  }
  async function joinRoom(code){
    setBusy(true)
    const {data,error}=await supabase.rpc('join_room_by_code',{p_code:code.trim().toUpperCase()})
    setBusy(false)
    if(error) return setToast(error.message)
    setModal('');setToast('You joined the room');window.history.replaceState({},'',window.location.pathname)
    const {data:joinedRoom}=await supabase.from('rooms').select('*').eq('id',data).single()
    await loadAll()
    if(joinedRoom){setSelectedRoom(joinedRoom);setTab('Expense Rooms')}
  }
  async function addGroupExpense(form){
    setBusy(true)
    const {data,error}=await supabase.from('group_expenses').insert({
      room_id:selectedRoom.id,created_by:user.id,paid_by:user.id,title:form.title,
      amount:Number(form.amount),category:form.category,expense_date:form.expense_date,split_type:form.split_type
    }).select().single()
    if(error){setBusy(false);return setToast(error.message)}
    const splits=form.splits.map(s=>({expense_id:data.id,user_id:s.user_id,amount:Number(s.amount)}))
    const {error:splitError}=await supabase.from('expense_splits').insert(splits)
    setBusy(false)
    if(splitError) return setToast(splitError.message)
    setModal('');setToast('Group expense added');await loadRoom(selectedRoom.id)
  }
  function computeBalances(){
    const ids=roomMembers.map(m=>m.user_id)
    const map=Object.fromEntries(ids.map(id=>[id,{paid:0,share:0,net:0}]))
    roomExpenses.forEach(e=>{
      if(map[e.paid_by]) map[e.paid_by].paid+=Number(e.amount)
      ;(e.expense_splits||[]).forEach(s=>{if(map[s.user_id])map[s.user_id].share+=Number(s.amount)})
    })
    payments.filter(p=>p.status==='confirmed').forEach(p=>{
      if(map[p.from_user_id]) map[p.from_user_id].paid+=Number(p.amount)
      if(map[p.to_user_id]) map[p.to_user_id].paid-=Number(p.amount)
    })
    ids.forEach(id=>map[id].net=map[id].paid-map[id].share)
    return map
  }
  function transfers(){
    const b=computeBalances()
    const creditors=roomMembers.map(m=>({id:m.user_id,amount:Math.max(0,b[m.user_id]?.net||0)})).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount)
    const debtors=roomMembers.map(m=>({id:m.user_id,amount:Math.max(0,-(b[m.user_id]?.net||0))})).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount)
    const out=[];let i=0,j=0
    while(i<debtors.length&&j<creditors.length){
      const amount=Math.min(debtors[i].amount,creditors[j].amount)
      if(amount>0) out.push({from:debtors[i].id,to:creditors[j].id,amount})
      debtors[i].amount-=amount;creditors[j].amount-=amount
      if(debtors[i].amount<.01)i++
      if(creditors[j].amount<.01)j++
    }
    return out
  }
  async function markPaid(transfer){
    const recipient=roomMembers.find(m=>m.user_id===transfer.to)?.profiles
    const upi=recipient?.upi_id
    if(upi){
      const params=new URLSearchParams({pa:upi,pn:recipient?.full_name||'RupeeSense member',am:Number(transfer.amount).toFixed(2),cu:'INR',tn:`RupeeSense ${selectedRoom.name} settlement`})
      window.location.href=`upi://pay?${params.toString()}`
    }
    const {error}=await supabase.from('settlement_payments').insert({
      room_id:selectedRoom.id,from_user_id:transfer.from,to_user_id:transfer.to,
      amount:transfer.amount,status:'pending',created_by:user.id
    })
    if(error) return setToast(error.message)
    setToast(upi?'UPI opened; payment is awaiting recipient confirmation.':'No UPI ID saved for recipient. Payment marked pending; use their preferred app and confirm with them.')
    await loadRoom(selectedRoom.id)
  }
  async function confirmPayment(p){
    const {error}=await supabase.from('settlement_payments').update({status:'confirmed',confirmed_at:new Date().toISOString()}).eq('id',p.id)
    if(error) return setToast(error.message)
    setToast('Payment confirmed');await loadRoom(selectedRoom.id)
  }
  async function updateProfile(updates){
    const {error}=await supabase.from('profiles').upsert({id:user.id,...updates})
    if(error) return setToast(error.message)
    setProfile({...profile,...updates});setModal('');setToast('Profile updated')
  }

  if(loading) return <div className="loading-screen"><div className="brand-mark">R</div><p>Preparing your ledgerâ€¦</p></div>
  if(!isConfigured) return <SetupGuide/>
  if(!session) return <Auth onAuth={()=>{}}/>
  const roomTotal=roomExpenses.reduce((s,e)=>s+Number(e.amount),0)
  const balances=selectedRoom?computeBalances():{}
  const roomName=m=>m?.profiles?.full_name||m?.profiles?.email?.split('@')[0]||'Member'
  const inviteUrl=selectedRoom?`${window.location.origin}/?join=${selectedRoom.invite_code}`:''
  const nav=[['Overview',LayoutDashboard],['Transactions',ReceiptText],['Financial Predictor',Sparkles],['Expense Rooms',Users],['Budgets & Goals',Target]]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">R</span><span>RUPEESENSE<small>THE ART OF MONEY</small></span></div>
      <div className="side-label">YOUR FINANCES</div>
      <nav>{nav.map(([name,Icon])=><button key={name} className={tab===name?'nav-item active':'nav-item'} onClick={()=>{setTab(name);setSelectedRoom(null)}}><Icon size={17}/>{name}{name==='Expense Rooms'&&<span className="nav-count">{rooms.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="side-note"><Gem size={17}/><p>Good money habits are a quiet kind of luxury.</p></div>
        <button className="nav-item" onClick={()=>setModal('profile')}><Settings size={17}/>Profile & settings</button>
        <button className="nav-item" onClick={signOut}><LogOut size={17}/>Sign out</button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div><div className="eyebrow">WEDNESDAY, YOUR MONEY JOURNAL</div><div className="page-title">{selectedRoom?'Expense room':tab}</div></div>
        <div className="top-actions"><button className="icon-btn" title="Refresh" onClick={refresh}><RefreshCw size={17}/></button><button className="icon-btn" onClick={()=>setModal('profile')}><Settings size={17}/></button><div className="user-chip"><span className="avatar">{initials(displayName)}</span><span>{displayName}</span><ChevronDown size={14}/></div></div>
      </header>

      {tab==='Overview'&&!selectedRoom&&<section className="content">
        <div className="welcome-row"><div><div className="eyebrow">YOUR FINANCIAL PORTRAIT</div><h1>Good to see you, {displayName.split(' ')[0]}.</h1><p className="muted">A clearer view of your money, one thoughtful choice at a time.</p></div><button className="btn btn-dark" onClick={()=>setModal('transaction')}><Plus size={16}/> Add transaction</button></div>
        <div className="stat-grid">
          <Stat title="Available balance" value={money(stats.balance)} icon={Wallet} note="Opening balance + income âˆ’ expenses"/>
          <Stat title="Total income" value={money(stats.income)} icon={ArrowDownLeft} positive note="Recorded income"/>
          <Stat title="Total expenses" value={money(stats.expenses)} icon={ArrowUpRight} note="Recorded personal spending"/>
          <Stat title="Predicted month-end" value={money(stats.predicted)} icon={Sparkles} positive={stats.predicted>=0} note="Forecast based on recent spending"/>
        </div>
        <div className="two-col">
          <div className="panel">
            <div className="panel-head"><div><div className="eyebrow">THE BIG PICTURE</div><h2>Spending composition</h2></div><span className="pill">This month</span></div>
            <CategoryBars transactions={transactions}/>
          </div>
          <div className="panel forecast-panel">
            <div className="eyebrow">A LOOK AHEAD</div><h2>Your money, in motion.</h2>
            <p className="muted">At your recent pace, you may have</p>
            <div className="forecast-number">{money(stats.predicted)}</div>
            <p className="muted">left at the end of this month.</p>
            <div className="forecast-meta"><span><Clock3 size={14}/> {stats.daysLeft} days remaining</span><span><TrendingDown size={14}/> {money(stats.daily)} / day avg.</span></div>
            <button className="text-link" onClick={()=>setTab('Financial Predictor')}>Explore forecast <ChevronRight size={15}/></button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><div className="eyebrow">LATEST ENTRIES</div><h2>Recent transactions</h2></div><button className="text-link" onClick={()=>setTab('Transactions')}>View all <ChevronRight size={15}/></button></div>
          <TransactionList transactions={transactions.slice(0,5)}/>
        </div>
        <div className="bottom-grid">
          <div className="panel mini-panel"><div className="eyebrow">GROUP FINANCES</div><h2>Better together.</h2><p className="muted">Share the bill, not the awkwardness. Create a room for trips, rent or everyday plans.</p><button className="btn btn-outline" onClick={()=>setTab('Expense Rooms')}><Users size={16}/> Open expense rooms</button></div>
          <div className="panel mini-panel"><div className="eyebrow">A SMALL REMINDER</div><h2>Spend with intention.</h2><p className="muted">Your daily guide is {money(stats.daily||0)} based on recent recorded spending.</p><button className="text-link" onClick={()=>setTab('Financial Predictor')}>See your daily outlook <ChevronRight size={15}/></button></div>
        </div>
      </section>}

      {tab==='Transactions'&&!selectedRoom&&<section className="content">
        <div className="welcome-row"><div><div className="eyebrow">YOUR PERSONAL LEDGER</div><h1>Every rupee, accounted for.</h1><p className="muted">A thoughtful record of what comes in and what goes out.</p></div><button className="btn btn-dark" onClick={()=>setModal('transaction')}><Plus size={16}/> Add transaction</button></div>
        <div className="panel">
          <div className="toolbar"><div className="searchbox"><Search size={16}/><input placeholder="Search transactionsâ€¦" value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All entries</option><option value="income">Income</option><option value="expense">Expenses</option></select></div>
          <TransactionList transactions={filtered} full/>
        </div>
      </section>}

      {tab==='Financial Predictor'&&!selectedRoom&&<section className="content">
        <div className="welcome-row"><div><div className="eyebrow">PREDICTIVE FINANCIAL INTELLIGENCE</div><h1>Look a little further.</h1><p className="muted">A forecast is a guide, not a promise. The more you record, the more useful it becomes.</p></div><span className="pill green"><Sparkles size={13}/> Live estimate</span></div>
        <div className="prediction-hero panel"><div><div className="eyebrow">ESTIMATED MONTH-END BALANCE</div><div className="prediction-big">{money(stats.predicted)}</div><p className="muted">Based on your current calculated balance and recent expense pace.</p></div><div className="prediction-stamp">RUPEESENSE<br/><b>FORECAST / 01</b></div></div>
        <div className="stat-grid three"><Stat title="Current balance" value={money(stats.balance)} icon={Wallet}/><Stat title="Average daily expense" value={money(stats.daily)} icon={TrendingDown}/><Stat title="Estimated runway" value={stats.depletion===null?'â€”':`${stats.depletion} days`} icon={Clock3}/></div>
        <div className="two-col">
          <div className="panel"><div className="eyebrow">YOUR PROJECTION</div><h2>How the estimate is formed</h2><div className="calc-row"><span>Current balance</span><b>{money(stats.balance)}</b></div><div className="calc-row"><span>Estimated spending over {stats.daysLeft} days</span><b>âˆ’ {money(stats.daily*stats.daysLeft)}</b></div><div className="calc-row total"><span>Projected balance</span><b>{money(stats.predicted)}</b></div><p className="small muted">The starter forecast uses your recent expense entries and a simple daily run-rate. It improves as you record more transactions.</p></div>
          <div className="panel"><div className="eyebrow">A GENTLE NUDGE</div><h2>What you could do next</h2><Recommendation stats={stats}/></div>
        </div>
        <div className="panel"><div className="eyebrow">SPENDING ANOMALIES</div><h2>Anything out of the ordinary?</h2><AnomalyList transactions={transactions}/></div>
      </section>}

      {tab==='Expense Rooms'&&!selectedRoom&&<section className="content">
        <div className="welcome-row"><div><div className="eyebrow">SHARED, SIMPLIFIED</div><h1>Good company. Clear accounts.</h1><p className="muted">Create a room for the people you share expenses with.</p></div><div className="button-row"><button className="btn btn-outline" onClick={()=>setModal('join')}><ArrowDownLeft size={16}/> Join a room</button><button className="btn btn-dark" onClick={()=>setModal('room')}><Plus size={16}/> Create room</button></div></div>
        {rooms.length===0?<div className="empty-state panel"><div className="empty-icon"><Users size={28}/></div><h2>Your first room awaits.</h2><p className="muted">Start a shared ledger for rent, a trip or the everyday things you split with friends.</p><button className="btn btn-dark" onClick={()=>setModal('room')}><Plus size={16}/> Create your first room</button></div>:<div className="room-grid">{rooms.map(r=><button className="room-card" key={r.id} onClick={()=>setSelectedRoom(r)}><div className="room-card-top"><span className="room-icon"><Users size={20}/></span><span className="pill">{r.room_type||'Shared'}</span></div><h2>{r.name}</h2><p className="muted">{r.description||'A shared space for expenses.'}</p><div className="room-card-foot"><span><CalendarDays size={14}/> Due {r.settlement_deadline||'Not set'}</span><span>Open room <ChevronRight size={14}/></span></div></button>)}</div>}
      </section>}

      {tab==='Expense Rooms'&&selectedRoom&&<section className="content">
        <button className="back-link" onClick={()=>setSelectedRoom(null)}><ArrowLeftRight size={15}/> All rooms</button>
        <div className="welcome-row"><div><div className="eyebrow">SHARED LEDGER / {selectedRoom.room_type?.toUpperCase()||'ROOM'}</div><h1>{selectedRoom.name}</h1><p className="muted">{selectedRoom.description||'Every shared expense, in one place.'}</p><p className="invite-code-line">INVITATION CODE <b>{selectedRoom.invite_code}</b></p></div><div className="button-row"><button className="btn btn-outline" onClick={()=>{navigator.clipboard.writeText(inviteUrl);setToast('Invite link copied')}}><Copy size={15}/> Copy invite link</button><button className="btn btn-dark" onClick={()=>setModal('groupExpense')}><Plus size={16}/> Add expense</button></div></div>
        <div className="stat-grid three"><Stat title="Total room expenses" value={money(roomTotal)} icon={Wallet}/><Stat title="Members" value={roomMembers.length} icon={Users}/><Stat title="Settlement deadline" value={selectedRoom.settlement_deadline||'â€”'} icon={CalendarDays}/></div>
        <div className="two-col">
          <div className="panel"><div className="panel-head"><div><div className="eyebrow">THE ROOM LEDGER</div><h2>Shared expenses</h2></div><span className="pill">{roomExpenses.length} entries</span></div><GroupExpenseList expenses={roomExpenses} members={roomMembers} currentUser={user}/></div>
          <div className="panel"><div className="eyebrow">WHO STANDS WHERE</div><h2>Member balances</h2>{roomMembers.map(m=><div className="member-line" key={m.user_id}><span className="avatar">{initials(roomName(m))}</span><span className="member-name">{roomName(m)}{m.user_id===user.id?' (you)':''}</span><b className={(balances[m.user_id]?.net||0)>=0?'positive':'negative'}>{(balances[m.user_id]?.net||0)>=0?'+':''}{money(balances[m.user_id]?.net||0)}</b></div>)}</div>
        </div>
        <div className="panel"><div className="panel-head"><div><div className="eyebrow">SETTLE UP</div><h2>Suggested transfers</h2></div><span className="pill green">Optimised</span></div>
          {transfers().length===0?<p className="muted">All balances are settled, or there are no shared expenses yet.</p>:transfers().map((t,i)=>{
            const from=roomMembers.find(m=>m.user_id===t.from),to=roomMembers.find(m=>m.user_id===t.to)
            const pending=payments.some(p=>p.from_user_id===t.from&&p.to_user_id===t.to&&Number(p.amount)===Number(t.amount)&&p.status!=='failed')
            return <div className="transfer-line" key={i}><div className="transfer-people"><span className="avatar">{initials(roomName(from))}</span><b>{roomName(from)}</b><ArrowRightIcon/><span className="avatar">{initials(roomName(to))}</span><b>{roomName(to)}</b></div><strong>{money(t.amount)}</strong>{t.from===user.id?<button className="btn btn-small btn-dark" onClick={()=>markPaid(t)} disabled={pending}>{pending?'Awaiting':'Mark paid'}</button>:<span className="pill">{pending?'Awaiting':'To receive'}</span>}</div>
          })}
        </div>
        <div className="panel"><div className="panel-head"><div><div className="eyebrow">PAYMENT RECORD</div><h2>Recent settlement activity</h2></div></div>
          {payments.length===0?<p className="muted">No settlement payments recorded yet.</p>:payments.map(p=><div className="payment-line" key={p.id}><span>{roomName(roomMembers.find(m=>m.user_id===p.from_user_id))} â†’ {roomName(roomMembers.find(m=>m.user_id===p.to_user_id))}</span><b>{money(p.amount)}</b><span className="pill">{p.status}</span>{p.to_user_id===user.id&&p.status==='pending'&&<button className="btn btn-small btn-outline" onClick={()=>confirmPayment(p)}>Confirm received</button>}</div>)}
        </div>
      </section>}

      {tab==='Budgets & Goals'&&!selectedRoom&&<BudgetGoals transactions={transactions} onSaveGoal={()=>setModal('goal')}/>}
    </main>
    {modal&&<Modal title={modalTitle(modal)} onClose={()=>setModal('')}><ModalContent type={modal} busy={busy} onTransaction={addTransaction} onRoom={createRoom} onJoin={joinRoom} onGroupExpense={addGroupExpense} onProfile={updateProfile} onGoal={async f=>{const {error}=await supabase.from('savings_goals').insert({...f,user_id:user.id,target_amount:Number(f.target_amount),saved_amount:Number(f.saved_amount||0)});if(error)setToast(error.message);else{setToast('Savings goal added');setModal('')}}} members={roomMembers} currentUser={user} profile={profile}/></Modal>}
    {toast&&<div className="toast"><Check size={16}/>{toast}<button onClick={()=>setToast('')}><X size={14}/></button></div>}
    <footer className="app-footer">RUPEESENSE Â· PRIVATE BY DESIGN Â· PREDICT. SHARE. SETTLE. SAVE.</footer>
  </div>
}

function ArrowRightIcon(){return <ChevronRight size={15} className="muted"/>}
function Stat({title,value,icon:Icon,note,positive}){return <div className="stat-card"><div className="stat-top"><span>{title}</span><Icon size={17}/></div><div className="stat-value">{value}</div><div className={positive===false?'stat-note negative':'stat-note'}>{note}</div></div>}
function CategoryBars({transactions}){
  const sums=categories.map(c=>({name:c,value:transactions.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+Number(t.amount),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,5)
  const max=Math.max(...sums.map(x=>x.value),1)
  return sums.length?<div className="bars">{sums.map(x=><div className="bar-row" key={x.name}><div><span>{x.name}</span><b>{money(x.value)}</b></div><div className="bar-track"><span style={{width:`${x.value/max*100}%`}}/></div></div>)}</div>:<div className="empty-inline">Your category breakdown will appear as you add expenses.</div>
}
function TransactionList({transactions,full=false}){
  if(!transactions.length)return <div className="empty-inline">No transactions yet. Add your first entry to begin your ledger.</div>
  return <div className="transaction-list">{transactions.map(t=><div className="transaction-row" key={t.id}><span className={'txn-icon '+t.type}>{t.type==='income'?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</span><div className="txn-desc"><b>{t.title}</b><small>{t.category} Â· {t.txn_date}</small></div><strong className={t.type==='income'?'positive':'normal'}>{t.type==='income'?'+':'âˆ’'}{money(t.amount)}</strong></div>)}</div>
}
function Recommendation({stats}){
  const text=stats.predicted<0?'Your current spending pace may exceed your available balance. Pause optional purchases and review upcoming commitments.':stats.daily===0?'Add a few transactions to receive a more useful personal spending recommendation.':`Your recent spending pace is about ${money(stats.daily)} per day. Consider setting a daily guide near ${money(stats.daily)} and reviewing it as new expenses come in.`
  return <div className="recommendation"><Sparkles size={18}/><p>{text}</p><small>Based on your recorded activity. Not financial advice.</small></div>
}
function AnomalyList({transactions}){
  const expenses=transactions.filter(t=>t.type==='expense')
  if(expenses.length<4)return <p className="muted">Add at least four expense entries to begin comparing recent spending patterns.</p>
  const values=expenses.map(t=>Number(t.amount)),avg=values.reduce((a,b)=>a+b,0)/values.length
  const unusual=expenses.filter(t=>Number(t.amount)>avg*1.8)
  return unusual.length?<div className="anomaly-list">{unusual.slice(0,5).map(t=><div className="anomaly-row" key={t.id}><TrendingUp size={16}/><span><b>{t.title}</b><small>{t.category} Â· {t.txn_date}</small></span><strong>{money(t.amount)}</strong><span className="pill amber">Review</span></div>)}</div>:<div className="empty-inline">No unusually large individual expenses detected in your current records. This simple screening compares each expense with your average recorded expense.</div>
}
function GroupExpenseList({expenses,members,currentUser}){
  const name=id=>members.find(m=>m.user_id===id)?.profiles?.full_name||members.find(m=>m.user_id===id)?.profiles?.email?.split('@')[0]||'Member'
  if(!expenses.length)return <div className="empty-inline">No shared expenses yet. Add the first expense to this room.</div>
  return <div className="transaction-list">{expenses.map(e=><div className="transaction-row" key={e.id}><span className="txn-icon"><ReceiptText size={17}/></span><div className="txn-desc"><b>{e.title}</b><small>{e.category} Â· Paid by {name(e.paid_by)} Â· {e.expense_date}</small></div><strong>{money(e.amount)}</strong></div>)}</div>
}
function BudgetGoals({transactions,onSaveGoal}){
  const [budget,setBudget]=useState(localStorage.getItem('rs_monthly_budget')||'10000')
  const [goals,setGoals]=useState([])
  useEffect(()=>{if(supabase) supabase.from('savings_goals').select('*').order('created_at',{ascending:false}).then(({data})=>setGoals(data||[]))},[])
  const spent=transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0)
  const pct=Math.min(100,spent/Math.max(Number(budget),1)*100)
  return <section className="content"><div className="welcome-row"><div><div className="eyebrow">A PLAN FOR YOUR RUPEES</div><h1>Give every rupee a purpose.</h1><p className="muted">Set a monthly spending guide and keep your savings intentions close.</p></div><button className="btn btn-dark" onClick={onSaveGoal}><Plus size={16}/> New savings goal</button></div>
    <div className="two-col"><div className="panel"><div className="eyebrow">MONTHLY SPENDING GUIDE</div><h2>Your budget</h2><label className="field-label">Monthly budget (â‚¹)<input type="number" value={budget} onChange={e=>setBudget(e.target.value)}/></label><button className="btn btn-outline" onClick={()=>{localStorage.setItem('rs_monthly_budget',budget);alert('Budget saved on this device')}}>Save budget</button><div className="budget-progress"><div><span>Recorded expenses</span><b>{money(spent)} / {money(budget)}</b></div><div className="bar-track"><span style={{width:pct+'%'}}/></div><small>{Math.max(0,100-pct).toFixed(0)}% of your budget remains</small></div></div>
    <div className="panel"><div className="eyebrow">SAVING WITH INTENTION</div><h2>Your goals</h2>{goals.length?goals.map(g=><div className="goal-line" key={g.id}><div><b>{g.name}</b><small>{money(g.saved_amount)} saved of {money(g.target_amount)}</small></div><span className="pill">{Math.round(g.saved_amount/g.target_amount*100)}%</span></div>):<p className="muted">No savings goals yet. Create one for something that matters to you.</p>}</div></div>
  </section>
}
function Modal({title,onClose,children}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>}
function modalTitle(t){return ({transaction:'Add a personal transaction',room:'Create an expense room',join:'Join an expense room',groupExpense:'Add a shared expense',profile:'Your profile',goal:'Create a savings goal'})[t]||'RupeeSense'}
function ModalContent({type,busy,onTransaction,onRoom,onJoin,onGroupExpense,onProfile,onGoal,members,currentUser,profile}){
  const [form,setForm]=useState({type:'expense',title:'',amount:'',category:'Food',txn_date:today(),payment_method:'UPI',description:'',name:'',room_type:'Shared living',settlement_deadline:'',billing_cycle:'Monthly',split_type:'equal',expense_date:today(),target_amount:'',saved_amount:'0',upi_id:profile?.upi_id||'',full_name:profile?.full_name||currentUser?.user_metadata?.full_name||'',code:new URLSearchParams(window.location.search).get('join')||''})
  const [selected,setSelected]=useState(members.map(m=>m.user_id))
  const [custom,setCustom]=useState({})
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const input=(label,key,props={})=><label>{label}<input value={form[key]??''} onChange={e=>set(key,e.target.value)} {...props}/></label>
  if(type==='transaction')return <form className="modal-form" onSubmit={e=>{e.preventDefault();onTransaction(form)}}><div className="segmented"><button type="button" className={form.type==='expense'?'selected':''} onClick={()=>set('type','expense')}>Expense</button><button type="button" className={form.type==='income'?'selected':''} onClick={()=>set('type','income')}>Income</button></div>{input('Title','title',{required:true,placeholder:'e.g. Monthly allowance'})}{input('Amount (â‚¹)','amount',{type:'number',min:'1',step:'0.01',required:true})}<div className="form-grid"><label>Category<select value={form.category} onChange={e=>set('category',e.target.value)}>{(form.type==='income'?['Allowance','Scholarship','Salary','Gift','Other']:categories).map(c=><option>{c}</option>)}</select></label>{input('Date','txn_date',{type:'date',required:true})}</div><label>Payment method<select value={form.payment_method} onChange={e=>set('payment_method',e.target.value)}>{['UPI','Cash','Card','Bank transfer','Other'].map(x=><option>{x}</option>)}</select></label>{input('Description (optional)','description')}<button className="btn btn-dark full" disabled={busy}>Save transaction</button></form>
  if(type==='room')return <form className="modal-form" onSubmit={e=>{e.preventDefault();onRoom({name:form.name,description:form.description,room_type:form.room_type,settlement_deadline:form.settlement_deadline||null,billing_cycle:form.billing_cycle})}}>{input('Room name','name',{required:true,placeholder:'e.g. Hostel Room 204'})}{input('Description','description',{placeholder:'Rent, groceries and monthly bills'})}<div className="form-grid"><label>Room type<select value={form.room_type} onChange={e=>set('room_type',e.target.value)}>{['Shared living','Trip','Outing','Family','Other'].map(x=><option>{x}</option>)}</select></label><label>Billing cycle<select value={form.billing_cycle} onChange={e=>set('billing_cycle',e.target.value)}>{['Weekly','15 days','Monthly','Custom'].map(x=><option>{x}</option>)}</select></label></div>{input('Settlement deadline','settlement_deadline',{type:'date'})}<p className="small muted">A private invitation code will be created. Share it only with people you trust.</p><button className="btn btn-dark full" disabled={busy}>Create room</button></form>
  if(type==='join')return <form className="modal-form" onSubmit={e=>{e.preventDefault();onJoin(form.code||'')}}>{input('Room invitation code','code',{required:true,placeholder:'e.g. A8K2P9Q'})}<p className="small muted">Ask the room creator for their invitation code. You must be signed in to join.</p><button className="btn btn-dark full" disabled={busy}>Join room</button></form>
  if(type==='groupExpense')return <form className="modal-form" onSubmit={e=>{e.preventDefault();const chosen=members.filter(m=>selected.includes(m.user_id));const total=Number(form.amount);let splits;if(form.split_type==='equal'){const each=Math.floor(total*100/chosen.length)/100;splits=chosen.map((m,i)=>({user_id:m.user_id,amount:i===chosen.length-1?Math.round((total-each*(chosen.length-1))*100)/100:each}))}else{splits=chosen.map(m=>({user_id:m.user_id,amount:Number(custom[m.user_id]||0)}));if(Math.abs(splits.reduce((s,x)=>s+x.amount,0)-total)>.01)return alert('Custom shares must add up to the total expense.')}onGroupExpense({...form,splits})}}>{input('Expense title','title',{required:true,placeholder:'e.g. Groceries'})}{input('Total amount (â‚¹)','amount',{type:'number',min:'0.01',step:'0.01',required:true})}<div className="form-grid"><label>Category<select value={form.category} onChange={e=>set('category',e.target.value)}>{categories.map(c=><option>{c}</option>)}</select></label>{input('Date','expense_date',{type:'date'})}</div><label>Split method<select value={form.split_type} onChange={e=>set('split_type',e.target.value)}><option value="equal">Equal split</option><option value="custom">Custom amounts</option></select></label><div className="member-picker"><b>Who shares this expense?</b>{members.map(m=><label className="check-line" key={m.user_id}><input type="checkbox" checked={selected.includes(m.user_id)} onChange={e=>setSelected(s=>e.target.checked?[...s,m.user_id]:s.filter(x=>x!==m.user_id))}/><span>{m.profiles?.full_name||m.profiles?.email||'Member'}</span>{form.split_type==='custom'&&selected.includes(m.user_id)&&<input className="share-input" type="number" min="0" step="0.01" placeholder="Share â‚¹" value={custom[m.user_id]||''} onChange={e=>setCustom(c=>({...c,[m.user_id]:e.target.value}))}/>}</label>)}</div><p className="small muted">The person adding this entry is recorded as the payer. For this starter version, expenses are entered by the member who paid.</p><button className="btn btn-dark full" disabled={busy||selected.length===0}>Add shared expense</button></form>
  if(type==='profile')return <form className="modal-form" onSubmit={e=>{e.preventDefault();onProfile({full_name:form.full_name||profile?.full_name||'',upi_id:form.upi_id})}}>{input('Display name','full_name')}{input('UPI ID (optional)','upi_id',{placeholder:'name@bank'})}<p className="small muted">Your UPI ID is used only to prepare payment details. Never enter your UPI PIN.</p><button className="btn btn-dark full">Save profile</button></form>
  if(type==='goal')return <form className="modal-form" onSubmit={e=>{e.preventDefault();onGoal({name:form.name,target_amount:form.target_amount,saved_amount:form.saved_amount,target_date:form.target_date||null})}}>{input('Goal name','name',{required:true,placeholder:'e.g. New laptop'})}{input('Target amount (â‚¹)','target_amount',{type:'number',min:'1',required:true})}{input('Already saved (â‚¹)','saved_amount',{type:'number',min:'0'})}{input('Target date','target_date',{type:'date'})}<button className="btn btn-dark full">Create goal</button></form>
  return null
}
function SetupGuide(){return <div className="setup-page"><div className="setup-card"><div className="brand"><span className="brand-mark">R</span><span>RUPEESENSE<small>THE ART OF MONEY</small></span></div><div className="eyebrow">ONE LAST SETUP</div><h1>Connect your private ledger.</h1><p className="muted">Add your Supabase project credentials to enable accounts, transactions and shared rooms.</p><ol><li>Create a Supabase project.</li><li>Run <code>supabase/schema.sql</code> in the Supabase SQL Editor.</li><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Paste your Project URL and anon/publishable key.</li><li>Restart the development server.</li></ol><p className="small muted">Never put your Supabase service-role key in this frontend project.</p></div></div>}
export default App
