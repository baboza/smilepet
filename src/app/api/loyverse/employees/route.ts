import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.LOYVERSE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Missing Loyverse token" }, { status: 401 });
  }

  try {
    const response = await fetch(`https://api.loyverse.com/v1.0/employees`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      next: { revalidate: 3600 } // cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Loyverse API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ employees: data.employees || [] });
  } catch (error: any) {
    console.error("Error fetching Loyverse employees:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
