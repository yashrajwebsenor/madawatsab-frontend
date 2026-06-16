const PageHeaderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="py-8 sm:h-[140px] sm:py-0 flex items-center bg-gradient-to-r from-primary to-[#123836]">
      {children}
    </div>
  );
};

export default PageHeaderWrapper;
