describe("noQuery helper singleton", function() {
  it("has extend functionality", function() {
    var gaining = {},
      lending = { "foo": "bar" };

    noQuery.extend(gaining, lending);
    expect(gaining.foo).toEqual("bar");
  });
});

describe("Bookmark", function() {
  var testUrl = "/good/url",
    badUrl = "/bad/url";

  it("class exists", function() {
    expect(Bookmark).not.toBe(null);
  });

  describe("has the ability to test whether its URL is valid", function() {
    beforeEach(function() {
      jasmine.Ajax.install();
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("makes an Ajax request on instantiation", function() {
      var bm = new Bookmark({ url: testUrl }),
        mockedRequest = jasmine.Ajax.requests.mostRecent();

      expect(mockedRequest.url).toEqual(testUrl);
    });

  });
});

describe("Container", function() {
  var c, trueRoot, subContainer,
  containerStub = {
    children: [
      { url: 'http://alpha.example.com'},
      { url: 'http://beta.example.com' },
      {
        children: [
          { url: 'http://sub1.example.com' },
          { url: 'http://sub2.example.com' },
          {
            children: [
          { url: 'http://subA1.example.com' },
          { url: 'http://subA2.example.com' },
            ]
          }
        ]
      }
    ]
  };

  beforeEach(function() {
    jasmine.Ajax.install();

      jasmine.Ajax.stubRequest('alpha').andReturn({
        "status": 200,
        "responseText": 'in alpha response'
      });

      jasmine.Ajax.stubRequest('beta').andReturn({
        "status": 400,
        "responseText": 'in beta response'
      });

      c = new Container([ containerStub ]);
      trueRoot = c.children[0];
      subContainer = trueRoot.containers()[0];
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("finds all nested containers", function() {
    expect(c.containers().length).toEqual(3);
  });

  it("finds all nested bookmarks", function() {
    expect(c.bookmarks().length).toEqual(6);
  });
});

