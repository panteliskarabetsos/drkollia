// /src/app/api/patients/route.js
import { supabase } from '../../lib/supabaseClient'

export async function GET() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}

export async function POST(request) {
  const body = await request.json();

  const { error } = await supabase.from('patients').insert([body]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}

export async function PUT(request) {
  const body = await request.json();

  if (!body.id) {
    return Response.json({ error: 'Missing patient ID' }, { status: 400 });
  }

  const { id, ...updateData } = body;

  const { error } = await supabase.from('patients').update(updateData).eq('id', id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}

export async function DELETE(request) {
  const { id } = await request.json();

  if (!id) {
    return Response.json({ error: 'Missing patient ID' }, { status: 400 });
  }

  const { error } = await supabase.from('patients').delete().eq('id', id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
