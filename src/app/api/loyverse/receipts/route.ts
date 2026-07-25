import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const token = process.env.LOYVERSE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Missing Loyverse token" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const minParam = searchParams.get('min');
    const maxParam = searchParams.get('max');

    let created_at_min = "";
    let created_at_max = "";

    if (minParam && maxParam) {
      created_at_min = minParam;
      created_at_max = maxParam;
    } else {
      const now = new Date();
      const startOfDayTH = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      startOfDayTH.setHours(0, 0, 0, 0);
      
      const endOfDayTH = new Date(startOfDayTH);
      endOfDayTH.setHours(23, 59, 59, 999);

      created_at_min = new Date(startOfDayTH.getTime() - (7 * 60 * 60 * 1000)).toISOString().split('.')[0] + 'Z';
      created_at_max = new Date(endOfDayTH.getTime() - (7 * 60 * 60 * 1000)).toISOString().split('.')[0] + 'Z';
    }

    const response = await fetch(`https://api.loyverse.com/v1.0/receipts?created_at_min=${created_at_min}&created_at_max=${created_at_max}&limit=250`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      next: { revalidate: 60 } // cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Loyverse API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Calculate total revenue from receipts
    let totalRevenue = 0;
    if (data.receipts && Array.isArray(data.receipts)) {
      data.receipts.forEach((receipt: any) => {
        // total_money includes the final amount
        totalRevenue += receipt.total_money || 0;
      });
    }

    return NextResponse.json({ totalRevenue, receipts: data.receipts || [] });
  } catch (error: any) {
    console.error("Error fetching Loyverse receipts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
