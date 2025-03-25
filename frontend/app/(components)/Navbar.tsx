// app/(components)/Navbar.tsx
interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {

  return (
    <header className="bg-[#09090b] w-full text-gray-300 py-4 px-6 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/*  Left Side: UserButton, Logo, and Title */}
        <div className="flex items-center">
          <h1 className="text-2xl sm:text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">{title}</h1>
        </div>
      </div>
    </header>
  );
};

export default Navbar;