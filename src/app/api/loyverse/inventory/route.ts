import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.LOYVERSE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Missing Loyverse token" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.loyverse.com/v1.0/items?limit=250", {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      next: { revalidate: 60 } // cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Loyverse API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching Loyverse items:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
