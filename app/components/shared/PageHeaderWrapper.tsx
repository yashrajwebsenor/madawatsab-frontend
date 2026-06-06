const PageHeaderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="sm:h-[140px] h-full py-10 sm:py-0 flex items-center bg-gradient-to-r from-primary to-[#123836]">
      {children}
    </div>
  );
};

export default PageHeaderWrapper;
