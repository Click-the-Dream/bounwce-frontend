declare module "next/server" {
  export class NextRequest extends Request {
    nextUrl: { searchParams: URLSearchParams };
  }
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}
