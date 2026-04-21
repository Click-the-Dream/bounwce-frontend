import ExploreCard from "./_components/ExploreCard";

const ExplorePage = () => {
  const cards = Array(8).fill({
    name: "Victorious Victor",
    handle: "p-origamixiii",
    bio: "Better to be woke and broke than sleep and creep",
    followers: 200,
    posts: 200,
    badges: 200,
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
      <main className="flex justify-center px-4 md:px-8 xl:px-14">
        <div className="w-fit">
          <h2 className="text-xl font-medium text-gray-700 mb-4 px-1">
            "Gym Partners near me"
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-2.5 gap-y-8.75 pb-12">
            {cards.map((card, index) => (
              <ExploreCard key={index} {...card} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
