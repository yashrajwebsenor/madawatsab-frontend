import { Card } from "@heroui/react";

type Props = {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
};

const Section = ({ title, icon, description, children, extra }: Props) => {
  return (
    <Card fullWidth shadow="none" className="p-6 border-none">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center p-3 bg-teal-50/50 rounded-xl">
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-medium text-slate-900 leading-tight">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-slate-400">{description}</p>
              )}
            </div>
            {extra && <div>{extra}</div>}
          </div>

          <div className="mt-4 w-full">{children}</div>
        </div>
      </div>
    </Card>
  );
};

export default Section;
