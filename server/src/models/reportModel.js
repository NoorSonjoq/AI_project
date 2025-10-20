const UserReport = sequelize.define(
  "UserReport",
  {
    report_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    report_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Untitled Report",
    },
    report_prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    pdf_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    pdf_data: {                 // 🟢 ضيفتي العمود هنا داخل object التعريف
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default UserReport;
