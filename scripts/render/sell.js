// scripts/render/sell.js
export async function renderSell() {
  const container = document.getElementById("router-view");
  if (!container) return;

  container.innerHTML = `
    <div style="max-width: 1100px; margin: 0 auto; padding: 40px 24px 120px 24px; font-family: var(--sans); color: var(--ink); box-sizing: border-box;">
       
       <h1 style="font-family: var(--serif); font-size: 36px; margin: 0 0 8px 0; color: #526442;">Seller Dashboard</h1>
       <p style="color: #78716c; margin: 0 0 40px 0; font-size: 16px;">Manage your conscious listings and track your environmental impact.</p>
       
       <div style="display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; margin-bottom: 24px;">
          
          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e7e5e4; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
             <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                <div>
                   <h3 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">Sales Performance</h3>
                   <span style="font-size: 11px; color: #a8a29e; font-weight: 700; letter-spacing: 1px;">LAST 30 DAYS</span>
                </div>
                <button style="border: 1px solid #d6d3d1; background: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor:pointer; color: #57534e; font-size: 13px;">Download Report</button>
             </div>
             
             <div style="height: 180px; display: flex; align-items: flex-end; gap: 16px;">
                <div style="flex:1; background: #e2e6db; height: 50%; border-radius: 6px 6px 0 0;"></div>
                <div style="flex:1; background: #e2e6db; height: 35%; border-radius: 6px 6px 0 0;"></div>
                <div style="flex:1.2; background: #9caf88; height: 90%; border-radius: 6px 6px 0 0; position: relative;">
                   <div style="position: absolute; top: -36px; left: 50%; transform: translateX(-50%); background: #1c1917; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                      Current: $1,850
                      <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: #1c1917;"></div>
                   </div>
                </div>
                <div style="flex:1; background: #e2e6db; height: 45%; border-radius: 6px 6px 0 0;"></div>
             </div>
             <div style="display: flex; justify-content: space-between; margin-top: 16px; font-size: 11px; color: #a8a29e; font-weight: 700; letter-spacing: 0.5px;">
                <span>WEEK 1</span><span>WEEK 2</span><span>WEEK 3</span><span>WEEK 4</span>
             </div>
          </div>

          <div style="background: #f4f5f0; border-radius: 16px; padding: 32px; display: flex; flex-direction: column;">
             <div style="width: 48px; height: 48px; border-radius: 50%; background: #e2e6db; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#526442" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
             </div>
             <h3 style="font-family: var(--serif); font-size: 26px; margin: 0 0 16px 0; color: #526442;">Sustainable Impact</h3>
             <p style="color: #57534e; font-size: 15px; line-height: 1.5; margin-bottom: auto;">Your circular sales have diverted 450kg of waste from landfills this month.</p>
             <div style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #57534e; letter-spacing: 1px; margin-bottom: 8px;">
                   <span>YEARLY GOAL</span><span style="color:#526442;">82%</span>
                </div>
                <div style="width: 100%; height: 6px; background: #d6d3d1; border-radius: 99px; overflow: hidden;">
                   <div style="width: 82%; height: 100%; background: #526442;"></div>
                </div>
             </div>
          </div>
       </div>

       <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 60px;">
         <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e7e5e4; cursor: pointer; transition: 0.2s;" onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='none'">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f4ea; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #526442;">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">Upload Item</h4>
            <p style="margin: 0; font-size: 14px; color: #78716c;">List a new curated piece</p>
         </div>
         <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e7e5e4; cursor: pointer; transition: 0.2s;" onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='none'">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #fdf5ef; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #c2410c;">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">Sales History</h4>
            <p style="margin: 0; font-size: 14px; color: #78716c;">View all past transactions</p>
         </div>
         <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e7e5e4; cursor: pointer; transition: 0.2s;" onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='none'">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #f5f5f4; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #57534e;">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">Seller Support</h4>
            <p style="margin: 0; font-size: 14px; color: #78716c;">Get help with shipping & returns</p>
         </div>
       </div>

       <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 style="font-family: var(--serif); font-size: 28px; margin: 0; color: #1c1917;">Active Listings</h2>
          <div style="display: flex; background: #f5f5f4; border-radius: 8px; padding: 4px; border: 1px solid #e7e5e4;">
             <button style="border: none; background: white; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: pointer; color: #1c1917;">All</button>
             <button style="border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #78716c; cursor: pointer;">Drafts</button>
             <button style="border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #78716c; cursor: pointer;">Sold</button>
          </div>
       </div>

       <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
          
          <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4;">
             <div style="position: relative; height: 220px; background: #fbfaf9;">
                <div style="position: absolute; top: 12px; left: 12px; background: white; padding: 4px 8px; border-radius: 99px; font-size: 10px; font-weight: 800; color: #57534e; display: flex; align-items: center; gap: 4px;">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> CURATED
                </div>
                <img src="assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png" style="width: 100%; height: 100%; object-fit: contain; padding: 20px; box-sizing: border-box;">
             </div>
             <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                   <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1c1917;">Eames Style Lounge</h4>
                   <strong style="font-size: 15px; color: #526442;">$1,200</strong>
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 24px;">
                   <span style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #78716c;">VINTAGE</span>
                   <span style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #78716c;">WOOD</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e7e5e4; padding-top: 12px;">
                   <span style="font-size: 12px; color: #78716c; display: flex; align-items: center; gap: 6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> 452 views
                   </span>
                   <span style="font-size: 13px; font-weight: 600; color: #57534e; cursor: pointer;">Edit</span>
                </div>
             </div>
          </div>

          <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4;">
             <div style="position: relative; height: 220px; background: #fbfaf9;">
                <div style="position: absolute; top: 12px; left: 12px; background: white; padding: 4px 8px; border-radius: 99px; font-size: 10px; font-weight: 800; color: #57534e; display: flex; align-items: center; gap: 4px;">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="#3d5a30"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg> ZERO WASTE
                </div>
                <img src="assets/figma-export/70e1f26af8d8c8a801bc699d95272597eb1791a6.png" style="width: 100%; height: 100%; object-fit: contain; padding: 20px; box-sizing: border-box; filter: brightness(0.9);">
             </div>
             <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                   <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1c1917;">Artisan Clay Vase</h4>
                   <strong style="font-size: 15px; color: #526442;">$85</strong>
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 24px;">
                   <span style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #78716c;">HANDMADE</span>
                   <span style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #78716c;">CERAMIC</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e7e5e4; padding-top: 12px;">
                   <span style="font-size: 12px; color: #78716c; display: flex; align-items: center; gap: 6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> 128 views
                   </span>
                   <span style="font-size: 13px; font-weight: 600; color: #57534e; cursor: pointer;">Edit</span>
                </div>
             </div>
          </div>

          <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4;">
             <div style="position: relative; height: 220px; background: #e7e5e4;">
                <img src="assets/figma-export/a56b6c49f52d789f50348bf05201345939481f39.png" style="width: 100%; height: 100%; object-fit: cover;">
             </div>
             <div style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                   <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1c1917;">Pure Flax Bedding</h4>
                   <strong style="font-size: 15px; color: #526442;">$210</strong>
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 24px;">
                   <span style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #78716c;">SUSTAINABLE</span>
                   <span style="background: #f5f5f4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #78716c;">LINEN</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e7e5e4; padding-top: 12px;">
                   <span style="font-size: 12px; color: #78716c; display: flex; align-items: center; gap: 6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> 89 views
                   </span>
                   <span style="font-size: 13px; font-weight: 600; color: #57534e; cursor: pointer;">Edit</span>
                </div>
             </div>
          </div>

          <div style="border: 2px dashed #d6d3d1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 350px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='#9caf88'; this.style.backgroundColor='#fbfaf9'" onmouseout="this.style.borderColor='#d6d3d1'; this.style.backgroundColor='transparent'">
             <div style="width: 48px; height: 48px; border-radius: 50%; border: 1px dashed #a8a29e; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #78716c;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             </div>
             <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #57534e;">Create New Listing</h4>
             <span style="font-size: 10px; font-weight: 800; color: #a8a29e; letter-spacing: 0.5px;">4 SLOTS REMAINING</span>
          </div>
       </div>

    </div>
  `;
}