export async function GET() {
  try {
    const response = await fetch(process.env.QUIZ_URL!);
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch quiz data:', error);
    return Response.json({ error: 'Failed to fetch quiz data' }, { status: 500 });
  }
}
