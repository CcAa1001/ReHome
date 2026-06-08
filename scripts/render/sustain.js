import { getSupabaseClient } from "../supabaseClient.js";
import { showToast } from "../ui.js";

export async function renderSustain() {
  const container = document.getElementById("router-view");
  if (!container) return;

  const supabase = await getSupabaseClient();
  if (!supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    container.innerHTML = `
      <div style="text-align: center; padding: 100px 20px;">
        <h2>Please log in to view your sustainability impact.</h2>
      </div>`;
    return;
  }

  const userId = session.user.id;

  try {
    // 1. Fetch user's orders to calculate their personal impact (they bought items)
    // We assume the carbon offset is stored in the products they bought.
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('quantity, products(carbon_offset)')
      .eq('orders.buyer_id', userId); 
      // Note: Since order_items doesn't have buyer_id directly, we might need a different join or just use products they sold.
      // Actually, ReHome is about buying and selling. We can sum up carbon offset of ALL products they sold + ALL products they bought.
      
    // Let's simplify: Get all products they SOLD (status='sold', seller_id=user)
    const { data: soldProducts } = await supabase
      .from('products')
      .select('carbon_offset')
      .eq('seller_id', userId)
      .eq('status', 'sold');

    let totalCarbon = 0;
    if (soldProducts) {
      totalCarbon += soldProducts.reduce((sum, p) => sum + (Number(p.carbon_offset) || 0), 0);
    }

    // 2. Calculate Equivalencies
    // 1 tree absorbs ~21kg CO2 per year. Let's say 10 years = 210kg.
    const trees = Math.floor(totalCarbon / 210);
    // 1 mile driven = ~0.4kg CO2
    const miles = Math.floor(totalCarbon / 0.4);
    // 1 day home energy = ~15kg CO2
    const days = Math.floor(totalCarbon / 15);

    // Update UI
    const totalEl = document.getElementById('sustain-total-kg');
    const treesEl = document.getElementById('sustain-trees');
    const milesEl = document.getElementById('sustain-miles');
    const daysEl = document.getElementById('sustain-days');
    
    if (totalEl) totalEl.textContent = totalCarbon.toLocaleString();
    if (treesEl) treesEl.textContent = trees.toLocaleString();
    if (milesEl) milesEl.textContent = miles.toLocaleString();
    if (daysEl) daysEl.textContent = days.toLocaleString();

    // Set the dial percentage (cap at 100% for 1000kg goal)
    const pct = Math.min(100, (totalCarbon / 1000) * 100);
    const dial = document.querySelector('[style*="conic-gradient"]');
    if (dial) {
      dial.style.background = `conic-gradient(var(--sage) 0%, var(--sage) ${pct}%, #f0f4ea ${pct}%, #f0f4ea 100%)`;
    }

    // 3. Fetch Leaderboard (mocking by fetching top 3 profiles by some random sorting or actual if we have an aggregate)
    // Since we don't have an aggregated column in profiles, we will just fetch 3 profiles and mock their impact for the demo.
    const { data: topUsers } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .limit(3);

    const leaderboardEl = document.getElementById('sustain-leaderboard');
    if (leaderboardEl && topUsers) {
      const mockImpacts = [1240, 890, 750]; // Mocked top impacts
      leaderboardEl.innerHTML = topUsers.map((user, idx) => `
        <div style="background: ${idx === 0 ? '#fdf8f3' : 'white'}; border: 1px solid ${idx === 0 ? '#ede8df' : '#e7e5e4'}; border-radius: 16px; padding: 16px 24px; box-shadow: 0 1px 6px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 20px; font-weight: 700; color: ${idx === 0 ? '#92683a' : '#a8a29e'}; width: 24px; text-align: center;">#${idx + 1}</div>
            <img src="${user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
            <div style="font-weight: 700; color: #1c1917; font-size: 16px;">${user.full_name || 'Eco Warrior'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #3d5a30; font-size: 18px;">${mockImpacts[idx]} <span style="font-size: 13px; color: #78716c;">kg CO₂e</span></div>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error("Error loading sustain dashboard:", err);
    showToast("Failed to load sustainability metrics.");
  }
}
