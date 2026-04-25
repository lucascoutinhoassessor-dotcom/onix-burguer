import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'income' | 'expense'
  const status = searchParams.get("status");
  const month = searchParams.get("month"); // YYYY-MM

  let query = supabaseAdmin
    .from("financial_entries")
    .select("*")
    .order("due_date", { ascending: false });

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (month) {
    query = query
      .gte("due_date", `${month}-01`)
      .lte("due_date", `${month}-31`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary totals
  const entries = data ?? [];
  const totalIncome = entries
    .filter((e) => e.type === "income" && e.status === "paid")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries
    .filter((e) => e.type === "expense" && e.status === "paid")
    .reduce((s, e) => s + Number(e.amount), 0);

  return NextResponse.json({
    entries,
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  const { data, error } = await supabaseAdmin
    .from("financial_entries")
    .insert({
      type: body.type ?? "expense",
      category: body.category,
      description: body.description,
      amount: Number(body.amount ?? 0),
      due_date: body.due_date,
      status: body.status ?? "pending"
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("financial_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("financial_entries").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
