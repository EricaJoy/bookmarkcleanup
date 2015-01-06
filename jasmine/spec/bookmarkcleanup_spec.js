describe("noQuery helper singleton", function() {
  it("has extend functionality", function() {
    var gaining = {},
      lending = { "foo": "bar" };

    noQuery.extend(gaining, lending);
    expect(gaining.foo).toEqual("bar");
  });
});

describe("Bookmark", function() {
  it("class exists", function() {
    expect(Bookmark).not.toBe(null);
  });
});
