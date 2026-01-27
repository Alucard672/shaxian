/** 必填项红色星号，用于表单 label */
export function RequiredMark({ required = true }: { required?: boolean }) {
  if (!required) return null
  return <span className="text-red-500">*</span>
}
