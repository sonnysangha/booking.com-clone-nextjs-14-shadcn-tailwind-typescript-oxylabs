import { SearchParams } from "@/app/search/page";
import { Result } from "@/typings";

export async function fetchResults(searchParams: SearchParams) {
  const username = process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PASSWORD;

  const url = new URL(searchParams.url);
  Object.keys(searchParams).forEach((key) => {
    if (key === "url" || key === "location") return;

    const value = searchParams[key as keyof SearchParams];

    if (typeof value === "string") {
      url.searchParams.append(key, value);
    }
  });

  console.log("scraping url >>>", url.href);

  const body = {
    source: "universal",
    url: url.href,
    parse: true,
    render: "html",
    parsing_instructions: {
      listings: {
        _fns: [
          {
            _fn: "xpath",
            _args: ["//div[@data-testid='property-card-container']"],
          },
        ],
        _items: {
          title: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//div[@data-testid='title']/text()"],
              },
            ],
          },
          description: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//h4[contains(@class, 'abf093bdfe e8f7c070a7')]/text()",
                ],
              },
            ],
          },
          booking_metadata: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[contains(@class, 'c5ca594cb1 f19ed67e4b')]/div[contains(@class, 'abf093bdfe f45d8e4c32')]/text()",
                ],
              },
            ],
          },
          link: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//a[contains(@class, 'a78ca197d0')]/@href"],
              },
            ],
          },
          price: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  `.//span[contains(@class, 'f6431b446c fbfd7c1165 e84eb96b1f')]/text()`,
                ],
              },
            ],
          },
          url: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//img/@src"],
              },
            ],
          },
          rating_word: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[@class='a3b8729ab1 e6208ee469 cb2cbb3ccb']/text()",
                ],
              },
            ],
          },
          rating: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//div[@class='a3b8729ab1 d86cee9b25']/text()"],
              },
            ],
          },
          rating_count: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[@class='abf093bdfe f45d8e4c32 d935416c47']/text()",
                ],
              },
            ],
          },
        },
      },
      total_listings: {
        _fns: [
          {
            _fn: "xpath_one",
            _args: [".//h1/text()"],
          },
        ],
      },
    },
  };

  const response = await fetch("https://realtime.oxylabs.io/v1/queries", {
    method: "POST",
    body: JSON.stringify(body),
    next: {
      revalidate: 60 * 60, // cache for 1 hour
    },
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.results.length === 0) return;
      const result: Result = data.results[0];

      return result;
    })
    .catch((err) => console.log(err));

  return response;
}
