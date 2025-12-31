export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    
    const url = `${process.env.QUIZ_URL}/${date ? `${date}.json` : '2026-01-01.json'}`;
    console.log('Fetching quiz data from URL:', url);
    const response = await fetch(url);
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch quiz data:', error);
    return Response.json({ error: 'Failed to fetch quiz data' }, { status: 500 });
  }
}
