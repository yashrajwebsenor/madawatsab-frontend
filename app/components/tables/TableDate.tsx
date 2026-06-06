import dayjs from "dayjs";

const TableDate = ({ date }: { date: Date | string }) => {
  const formattedDate = dayjs(date).format("DD MMM YYYY");
  const formattedTime = dayjs(date).format("hh:mm A");

  return (
    <div>
      <p className="text-sm text-gray-800">{formattedDate}</p>
      <p className="text-xs text-gray-500">{formattedTime}</p>
    </div>
  );
};

export default TableDate;
